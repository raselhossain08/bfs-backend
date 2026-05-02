import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import Stripe from 'stripe';
import { CmsService } from '../cms/cms.service';
import { Cause } from '../causes/entities/cause.entity';
import { Donation } from '../causes/entities/donation.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EmailTemplates } from '../email/email.templates';

type StripeInstance = InstanceType<typeof Stripe>;

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  metadata: {
    donorId?: string;
    donorName?: string;
    donorEmail?: string;
    campaignId?: string;
    campaignName?: string;
    motivation?: string;
  };
  created: number;
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: StripeInstance | null = null;

  constructor(
    private readonly cmsService: CmsService,
    private readonly emailService: EmailService,
    @InjectRepository(Cause)
    private causeRepository: Repository<Cause>,
    @InjectRepository(Donation)
    private donationRepository: Repository<Donation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2026-03-25.dahlia' as any,
      });
    }
  }

  /**
   * Process a successful Stripe Checkout session and record it as a donation.
   * Called by the webhook controller.
   */
  async handleCheckoutSessionCompleted(
    session: StripePaymentIntent['metadata'] & {
      sessionId: string;
      amount: number;
      currency: string;
    },
  ) {
    this.logger.log(`Processing Stripe payment: ${session.sessionId}`);

    // Use transaction to ensure atomicity and prevent race conditions
    return await this.dataSource.transaction(async (manager) => {
      // Check for duplicate donation WITH LOCK
      const existingDonation = await manager.findOne(Donation, {
        where: { transactionId: session.sessionId },
        lock: { mode: 'pessimistic_write' },
      });

      if (existingDonation) {
        this.logger.warn(
          `Donation already exists for session ${session.sessionId}, skipping duplicate`,
        );
        return existingDonation;
      }

      let donorId: number | undefined = undefined;
      let autoRegisteredUser: {
        email: string;
        plainPassword: string;
        name: string;
      } | null = null;
      let isExistingUser = false;

      // Step 1: Try to find user by donorId
      if (session.donorId) {
        const parsedId = parseInt(session.donorId, 10);
        if (!isNaN(parsedId)) {
          const user = await manager.findOne(User, {
            where: { id: parsedId },
          });
          if (user) {
            donorId = parsedId;
            isExistingUser = true;
            this.logger.log(
              `Donation associated with existing user ID: ${donorId}`,
            );
            // Use user's email/name from database if not provided in metadata
            if (!session.donorEmail) {
              session.donorEmail = user.email;
            }
            if (!session.donorName || session.donorName === 'Anonymous') {
              session.donorName =
                `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                user.email.split('@')[0];
            }
          } else {
            this.logger.warn(`User ID ${parsedId} not found in database`);
          }
        }
      }

      // Step 2: If no donorId, try to find user by email
      if (!donorId && session.donorEmail) {
        const existingUser = await manager.findOne(User, {
          where: { email: session.donorEmail },
        });
        if (existingUser) {
          donorId = existingUser.id;
          isExistingUser = true;
          this.logger.log(
            `Found existing user by email: ${session.donorEmail} (ID: ${donorId})`,
          );
        }
      }

      // Step 3: Auto-register if no user found and email is provided
      if (!donorId && session.donorEmail) {
        this.logger.log(
          `No account found for donor email: ${session.donorEmail}. Auto-registering...`,
        );
        const result = await this.autoRegisterDonorInTransaction(
          session.donorEmail,
          session.donorName,
          manager,
        );
        if (result) {
          donorId = result.userId;
          autoRegisteredUser = {
            email: session.donorEmail,
            plainPassword: result.plainPassword,
            name: session.donorName || 'Valued Donor',
          };
          this.logger.log(
            `Auto-registered donor ${session.donorEmail} as user ID: ${donorId}`,
          );
        } else {
          this.logger.error(
            `Auto-registration failed for ${session.donorEmail}`,
          );
        }
      }

      // Create donation record
      const donation = manager.create(Donation, {
        transactionId: session.sessionId,
        amount: session.amount / 100, // Convert from cents to dollars
        currency: (session.currency || 'USD').toUpperCase(),
        causeId: session.campaignId
          ? parseInt(session.campaignId, 10)
          : undefined,
        causeName: session.campaignName || 'General Support',
        paymentMethod: 'Stripe',
        status: 'completed',
        donorId: donorId,
        name: session.donorName || 'Anonymous',
        email: session.donorEmail || undefined,
        motivation: session.motivation || 'Online Donation',
        isAnonymous: !session.donorEmail || session.donorName === 'Anonymous',
      } as Donation);

      const savedDonation = await manager.save(donation);
      this.logger.log(
        `Donation created: ID=${savedDonation.id}, Amount=${savedDonation.amount} ${savedDonation.currency}, Donor=${savedDonation.donorId ? `User ${savedDonation.donorId}` : 'Anonymous'}`,
      );

      // Update cause statistics if linked to a cause
      if (savedDonation.causeId) {
        await this.updateCauseStats(savedDonation.causeId);
      }

      // Send credentials email if auto-registered
      if (autoRegisteredUser) {
        const donationAmount = `${savedDonation.currency} ${savedDonation.amount.toFixed(2)}`;
        this.sendCredentialsEmail(
          autoRegisteredUser.email,
          autoRegisteredUser.plainPassword,
          autoRegisteredUser.name,
          donationAmount,
          savedDonation.causeName || 'General Support',
        ).catch((err) => {
          this.logger.error(
            `Failed to send credentials email to ${autoRegisteredUser.email}: ${err.message}`,
            err.stack,
          );
        });
      } else if (isExistingUser && session.donorEmail) {
        // Send thank you email to existing users
        this.sendThankYouEmail(
          session.donorEmail,
          session.donorName || 'Valued Donor',
          `${savedDonation.currency} ${savedDonation.amount.toFixed(2)}`,
          savedDonation.causeName || 'General Support',
        ).catch((err) => {
          this.logger.error(
            `Failed to send thank you email to ${session.donorEmail}: ${err.message}`,
          );
        });
      }

      // Update cause statistics if linked to a cause (in same transaction)
      if (savedDonation.causeId) {
        await this.updateCauseStatsInTransaction(
          savedDonation.causeId,
          manager,
        );
      }

      // Send credentials email if auto-registered (outside transaction - async)
      if (autoRegisteredUser) {
        const donationAmount = `${savedDonation.currency} ${savedDonation.amount.toFixed(2)}`;
        this.sendCredentialsEmail(
          autoRegisteredUser.email,
          autoRegisteredUser.plainPassword,
          autoRegisteredUser.name,
          donationAmount,
          savedDonation.causeName || 'General Support',
        ).catch((err) => {
          this.logger.error(
            `Failed to send credentials email to ${autoRegisteredUser.email}: ${err.message}`,
            err.stack,
          );
        });
      } else if (isExistingUser && session.donorEmail) {
        // Send thank you email to existing users
        this.sendThankYouEmail(
          session.donorEmail,
          session.donorName || 'Valued Donor',
          `${savedDonation.currency} ${savedDonation.amount.toFixed(2)}`,
          savedDonation.causeName || 'General Support',
        ).catch((err) => {
          this.logger.error(
            `Failed to send thank you email to ${session.donorEmail}: ${err.message}`,
          );
        });
      }

      return savedDonation;
    });
  }

  /**
   * Auto-register donor within an existing transaction
   */
  private async autoRegisterDonorInTransaction(
    email: string,
    name?: string,
    manager?: any,
  ): Promise<{ userId: number; plainPassword: string } | null> {
    try {
      // Check if user already exists (using transaction manager if provided)
      const repo = manager || this.userRepository;
      const existingUser = await repo.findOne(User, {
        where: { email },
      });
      if (existingUser) {
        this.logger.log(
          `User already exists with email ${email}, not auto-registering`,
        );
        return { userId: existingUser.id, plainPassword: '' };
      }

      // Generate a strong random password (12 chars: letters + numbers)
      const plainPassword = this.generateSecurePassword(12);
      const hashedPassword = await bcrypt.hash(plainPassword, 12);

      const nameParts = (name || '').split(' ').filter(Boolean);
      const firstName =
        nameParts[0] || email.split('@')[0].replace(/[^a-zA-Z]/g, '');
      const lastName = nameParts.slice(1).join(' ') || 'Donor';

      const user = repo.create(User, {
        email,
        password: hashedPassword,
        firstName: firstName || 'Valued',
        lastName: lastName || 'Donor',
        role: 'user',
        status: 'active',
        emailVerified: true,
        phoneVerified: false,
        twoFactorEnabled: false,
        allowOtpLogin: true,
        notificationPreferences: {
          emailReceipts: true,
          emailUpdates: true,
          emailMarketing: false,
          smsAlerts: false,
          loginAlerts: true,
          securityAlerts: true,
        },
      });
      const savedUser = await repo.save(user);

      // Generate unique referral code
      const referralCode = `${firstName.substring(0, 3).toUpperCase() || 'DON'}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      savedUser.referralCode = referralCode;
      await repo.save(savedUser);

      this.logger.log(
        `Auto-registered donor ${email} as user ID: ${savedUser.id} with referral code: ${referralCode}`,
      );

      return { userId: savedUser.id, plainPassword };
    } catch (error) {
      this.logger.error(
        `Auto-registration failed for ${email}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Update cause stats within an existing transaction
   */
  private async updateCauseStatsInTransaction(
    causeId: number,
    manager: any,
  ): Promise<void> {
    try {
      const result = await manager
        .createQueryBuilder(Donation, 'donation')
        .select('SUM(donation.amount)', 'totalRaised')
        .addSelect('COUNT(DISTINCT donation.email)', 'uniqueDonors')
        .where('donation.causeId = :causeId', { causeId })
        .andWhere('donation.status = :status', { status: 'completed' })
        .getRawOne();

      const totalRaised = parseFloat(result?.totalRaised || '0');
      const uniqueDonors = parseInt(result?.uniqueDonors || '0', 10);

      const cause = await manager.findOne(Cause, { where: { id: causeId } });
      if (!cause) {
        this.logger.warn(`Cause ${causeId} not found for stats update`);
        return;
      }

      const goal = parseFloat(cause.goal?.toString() || '0');
      const progress =
        goal > 0 ? Math.min(100, Math.round((totalRaised / goal) * 100)) : 0;

      await manager.update(Cause, causeId, {
        raised: totalRaised,
        donors: uniqueDonors,
        progress,
      });

      this.logger.log(
        `Updated stats for cause ${causeId}: raised=$${totalRaised}, donors=${uniqueDonors}, progress=${progress}%`,
      );
    } catch (error) {
      this.logger.error(`Failed to update cause stats for ${causeId}`, error);
    }
  }

  private async autoRegisterDonor(
    email: string,
    name?: string,
  ): Promise<{ userId: number; plainPassword: string } | null> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser) {
        this.logger.log(
          `User already exists with email ${email}, not auto-registering`,
        );
        return { userId: existingUser.id, plainPassword: '' };
      }

      // Generate a strong random password (12 chars: letters + numbers)
      const plainPassword = this.generateSecurePassword(12);
      const hashedPassword = await bcrypt.hash(plainPassword, 12);

      const nameParts = (name || '').split(' ').filter(Boolean);
      const firstName =
        nameParts[0] || email.split('@')[0].replace(/[^a-zA-Z]/g, '');
      const lastName = nameParts.slice(1).join(' ') || 'Donor';

      const user = this.userRepository.create({
        email,
        password: hashedPassword,
        firstName: firstName || 'Valued',
        lastName: lastName || 'Donor',
        role: 'user',
        status: 'active',
        emailVerified: true, // Auto-verify since they received donation receipt email
        phoneVerified: false,
        twoFactorEnabled: false,
        allowOtpLogin: true,
        notificationPreferences: {
          emailReceipts: true,
          emailUpdates: true,
          emailMarketing: false,
          smsAlerts: false,
          loginAlerts: true,
          securityAlerts: true,
        },
      });
      const savedUser = await this.userRepository.save(user);

      // Generate unique referral code
      const referralCode = `${firstName.substring(0, 3).toUpperCase() || 'DON'}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      savedUser.referralCode = referralCode;
      await this.userRepository.save(savedUser);

      this.logger.log(
        `Auto-registered donor ${email} as user ID: ${savedUser.id} with referral code: ${referralCode}`,
      );

      return { userId: savedUser.id, plainPassword };
    } catch (error) {
      this.logger.error(
        `Auto-registration failed for ${email}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Generate a secure random password with letters and numbers
   */
  private generateSecurePassword(length: number = 12): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomValues = crypto.randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars[randomValues[i] % chars.length];
    }
    return password;
  }

  private async sendCredentialsEmail(
    email: string,
    plainPassword: string,
    name: string,
    donationAmount: string,
    causeName: string,
  ): Promise<void> {
    const sent = await this.emailService.sendDonorCredentialsEmail(email, {
      name,
      email,
      password: plainPassword,
      donationAmount,
      causeName,
    });
    if (sent) {
      this.logger.log(`Credentials email sent successfully to ${email}`);
    } else {
      this.logger.error(`Failed to send credentials email to ${email}`);
    }
  }

  private async sendThankYouEmail(
    email: string,
    name: string,
    donationAmount: string,
    causeName: string,
  ): Promise<void> {
    const sent = await this.emailService.sendEmail(
      email,
      `Thank You for Your Donation of ${donationAmount}!`,
      this.generateThankYouHtml(name, donationAmount, causeName),
    );
    if (sent) {
      this.logger.log(`Thank you email sent successfully to ${email}`);
    } else {
      this.logger.error(`Failed to send thank you email to ${email}`);
    }
  }

  private generateThankYouHtml(
    name: string,
    donationAmount: string,
    causeName: string,
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You - Birdsfly Sangstha</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f4f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" width="600" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 40px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Thank You!</h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your generosity makes a difference</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 40px;">
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Dear <strong>${name}</strong>,</p>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">Thank you for your generous donation of <strong>${donationAmount}</strong>${causeName ? ` to <strong>${causeName}</strong>` : ''}. Your support helps us continue our mission and make a positive impact in the community.</p>

                            <div style="background-color: #f0fdfa; border-radius: 12px; padding: 24px; margin: 30px 0; border-left: 4px solid #0d9488;">
                                <p style="margin: 0 0 10px 0; color: #0f766e; font-size: 14px; font-weight: 600;">Donation Summary</p>
                                <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount:</td>
                                        <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 600; text-align: right;">${donationAmount}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">Cause:</td>
                                        <td style="padding: 8px 0; color: #111827; font-size: 15px; font-weight: 600; border-top: 1px solid #e5e7eb; text-align: right;">${causeName}</td>
                                    </tr>
                                </table>
                            </div>

                            <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">You can view your donation history and download tax receipts by logging into your account on our website.</p>
                            <p style="margin: 20px 0 0 0; color: #374151; font-size: 16px; line-height: 1.6;">Warm regards,<br><strong>Birdsfly Sangstha Team</strong></p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-align: center;">Need help? Contact us at <a href="mailto:birdsflysangstha@gmail.com" style="color: #0d9488; text-decoration: none;">birdsflysangstha@gmail.com</a></p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Birdsfly Sangstha. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  }

  /**
   * Update cause statistics after a donation
   */
  private async updateCauseStats(causeId: number): Promise<void> {
    // Calculate total raised and donor count
    const result = await this.donationRepository
      .createQueryBuilder('donation')
      .select('SUM(donation.amount)', 'totalRaised')
      .addSelect('COUNT(DISTINCT donation.email)', 'uniqueDonors')
      .where('donation.causeId = :causeId', { causeId })
      .andWhere('donation.status = :status', { status: 'completed' })
      .getRawOne();

    const totalRaised = parseFloat(result?.totalRaised || '0');
    const uniqueDonors = parseInt(result?.uniqueDonors || '0', 10);

    // Get cause to calculate progress
    const cause = await this.causeRepository.findOne({
      where: { id: causeId },
    });
    const goal = parseFloat(cause?.goal?.toString() || '0');
    const progress =
      goal > 0 ? Math.min(100, Math.round((totalRaised / goal) * 100)) : 0;

    // Update cause
    await this.causeRepository.update(causeId, {
      raised: totalRaised,
      donors: uniqueDonors,
      progress,
    });

    this.logger.log(
      `Updated stats for cause ${causeId}: raised=$${totalRaised}, donors=${uniqueDonors}, progress=${progress}%`,
    );
  }

  /**
   * Handle payment failure events
   */
  async handlePaymentIntentFailed(
    session: StripePaymentIntent['metadata'] & {
      sessionId: string;
      amount: number;
    },
  ) {
    this.logger.warn(`Payment failed: ${session.sessionId}`);

    // Record failed payment for analytics
    const donation = this.donationRepository.create({
      transactionId: session.sessionId,
      amount: session.amount / 100,
      currency: 'usd',
      causeId: session.campaignId
        ? parseInt(session.campaignId, 10)
        : undefined,
      causeName: session.campaignName || 'General Support',
      paymentMethod: 'Stripe',
      status: 'failed',
      name: session.donorName || 'Anonymous',
      email: session.donorEmail || undefined,
    } as Donation);

    await this.donationRepository.save(donation);
    return { recorded: true, status: 'failed' };
  }

  /**
   * Retrieve a Stripe Checkout Session by ID
   * Requires STRIPE_SECRET_KEY environment variable
   */
  async getCheckoutSession(sessionId: string): Promise<any> {
    if (!this.stripe) {
      throw new Error(
        'Stripe is not configured. STRIPE_SECRET_KEY is missing.',
      );
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'payment_intent', 'line_items'],
    });

    return session;
  }

  /**
   * Get Stripe payouts list
   * Requires STRIPE_SECRET_KEY environment variable
   */
  async getPayouts(limit: number = 10): Promise<any[]> {
    if (!this.stripe) {
      throw new Error(
        'Stripe is not configured. STRIPE_SECRET_KEY is missing.',
      );
    }

    try {
      const payouts = await this.stripe.payouts.list({
        limit,
        status: 'paid',
      });

      return payouts.data.map((payout) => ({
        id: payout.id,
        amount: payout.amount / 100, // Convert from cents
        currency: payout.currency.toUpperCase(),
        status: payout.status,
        date: new Date(payout.arrival_date * 1000).toISOString(),
        method: payout.method || 'Bank Transfer',
        description: payout.description || 'Stripe Payout',
        statement_descriptor: payout.statement_descriptor,
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch payouts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Stripe balance
   * Requires STRIPE_SECRET_KEY environment variable
   */
  async getBalance(): Promise<{
    available: number;
    pending: number;
    currency: string;
  }> {
    if (!this.stripe) {
      throw new Error(
        'Stripe is not configured. STRIPE_SECRET_KEY is missing.',
      );
    }

    try {
      const balance = await this.stripe.balance.retrieve();

      const available = balance.available.reduce((sum, b) => sum + b.amount, 0);
      const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0);

      return {
        available: available / 100,
        pending: pending / 100,
        currency: balance.available[0]?.currency?.toUpperCase() || 'USD',
      };
    } catch (error) {
      this.logger.error(`Failed to fetch balance: ${error.message}`);
      throw error;
    }
  }
}
