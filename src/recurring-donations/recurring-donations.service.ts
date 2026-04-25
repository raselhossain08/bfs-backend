import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { RecurringDonation } from './entities/recurring-donation.entity';
import { CreateRecurringDonationDto } from './dto/create-recurring.dto';
import { UpdateRecurringDonationDto } from './dto/update-recurring.dto';
import { User } from '../users/entities/user.entity';
import { PaymentMethod } from '../payment-methods/entities/payment-method.entity';
import { Cause } from '../causes/entities/cause.entity';

type StripeInstance = InstanceType<typeof Stripe>;

@Injectable()
export class RecurringDonationsService {
  private readonly logger = new Logger(RecurringDonationsService.name);
  private stripe: StripeInstance | null = null;

  private ensureStripe(): StripeInstance {
    if (!this.stripe) {
      throw new Error(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
      );
    }
    return this.stripe;
  }

  constructor(
    @InjectRepository(RecurringDonation)
    private recurringDonationRepository: Repository<RecurringDonation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(Cause)
    private causeRepository: Repository<Cause>,
  ) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16' as any,
      });
    }
  }

  /**
   * Get or create a Stripe Customer for the user
   */
  private async getOrCreateStripeCustomer(user: User): Promise<string> {
    const stripe = this.ensureStripe();

    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe Customer
    const customer = await stripe.customers.create({
      email: user.email,
      name:
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
      metadata: {
        userId: user.id.toString(),
      },
    });

    // Save customer ID to user
    user.stripeCustomerId = customer.id;
    await this.userRepository.save(user);

    this.logger.log(
      `Created Stripe customer ${customer.id} for user ${user.id}`,
    );
    return customer.id;
  }

  /**
   * Convert frequency to Stripe interval
   */
  private getStripeInterval(frequency: string): {
    interval: 'week' | 'month' | 'year';
    interval_count: number;
  } {
    switch (frequency) {
      case 'weekly':
        return { interval: 'week', interval_count: 1 };
      case 'monthly':
        return { interval: 'month', interval_count: 1 };
      case 'quarterly':
        return { interval: 'month', interval_count: 3 };
      case 'yearly':
        return { interval: 'year', interval_count: 1 };
      default:
        return { interval: 'month', interval_count: 1 };
    }
  }

  /**
   * Calculate next donation date based on frequency
   */
  private calculateNextDonationDate(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        break;
      case 'yearly':
        now.setFullYear(now.getFullYear() + 1);
        break;
    }
    return now;
  }

  /**
   * Create a Stripe Product and Price for recurring donation
   */
  private async createStripeProductAndPrice(
    amount: number,
    frequency: string,
    causeName: string,
  ): Promise<{ productId: string; priceId: string }> {
    // Create product
    const product = await this.ensureStripe().products.create({
      name: `Recurring Donation - ${causeName || 'General Fund'} (${frequency})`,
      metadata: {
        type: 'recurring_donation',
        frequency,
      },
    });

    const { interval, interval_count } = this.getStripeInterval(frequency);

    // Create price (amount in cents)
    const price = await this.ensureStripe().prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      recurring: {
        interval,
        interval_count,
      },
      metadata: {
        frequency,
      },
    });

    return { productId: product.id, priceId: price.id };
  }

  /**
   * Get all recurring donations for a user
   */
  async findAll(userId: number): Promise<RecurringDonation[]> {
    return this.recurringDonationRepository.find({
      where: { userId },
      relations: ['cause', 'paymentMethod'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a single recurring donation by ID
   */
  async findOne(userId: number, id: number): Promise<RecurringDonation> {
    const donation = await this.recurringDonationRepository.findOne({
      where: { id },
      relations: ['cause', 'paymentMethod'],
    });

    if (!donation) {
      throw new NotFoundException('Recurring donation not found');
    }

    if (donation.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this recurring donation',
      );
    }

    return donation;
  }

  /**
   * Create a new recurring donation with Stripe subscription
   */
  async create(
    userId: number,
    dto: CreateRecurringDonationDto,
  ): Promise<RecurringDonation> {
    // Get user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify payment method belongs to user
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: dto.paymentMethodId },
    });

    if (!paymentMethod || paymentMethod.userId !== userId) {
      throw new ForbiddenException(
        'Payment method not found or does not belong to user',
      );
    }

    // Get cause if specified
    let cause: Cause | null = null;
    if (dto.causeId) {
      cause = await this.causeRepository.findOne({
        where: { id: dto.causeId },
      });
      if (!cause) {
        throw new NotFoundException('Cause not found');
      }
    }

    // Get or create Stripe customer
    const stripeCustomerId = await this.getOrCreateStripeCustomer(user);

    // Create Stripe product and price
    const { priceId } = await this.createStripeProductAndPrice(
      dto.amount,
      dto.frequency,
      cause?.title || 'General Fund',
    );

    // Create Stripe subscription
    const subscription = await this.ensureStripe().subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethod.stripePaymentMethodId,
      metadata: {
        userId: userId.toString(),
        causeId: dto.causeId?.toString() || '',
        frequency: dto.frequency,
      },
    });

    // Calculate next donation date
    const nextDonationDate = this.calculateNextDonationDate(dto.frequency);

    // Create recurring donation record
    const recurringDonation = this.recurringDonationRepository.create({
      userId,
      causeId: dto.causeId ?? undefined,
      amount: dto.amount,
      frequency: dto.frequency,
      paymentMethodId: dto.paymentMethodId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId,
      status: 'active',
      nextDonationDate,
      startDate: new Date(),
      totalDonated: 0,
      donationCount: 0,
    } as RecurringDonation);

    const saved =
      await this.recurringDonationRepository.save(recurringDonation);

    this.logger.log(
      `Created recurring donation ${saved.id} with Stripe subscription ${subscription.id}`,
    );

    // Return with relations
    return this.findOne(userId, saved.id);
  }

  /**
   * Update a recurring donation
   */
  async update(
    userId: number,
    id: number,
    dto: UpdateRecurringDonationDto,
  ): Promise<RecurringDonation> {
    const donation = await this.findOne(userId, id);

    // If changing payment method, verify ownership
    if (
      dto.paymentMethodId &&
      dto.paymentMethodId !== donation.paymentMethodId
    ) {
      const paymentMethod = await this.paymentMethodRepository.findOne({
        where: { id: dto.paymentMethodId },
      });

      if (!paymentMethod || paymentMethod.userId !== userId) {
        throw new ForbiddenException(
          'Payment method not found or does not belong to user',
        );
      }

      // Update Stripe subscription default payment method
      if (donation.stripeSubscriptionId) {
        await this.ensureStripe().subscriptions.update(
          donation.stripeSubscriptionId,
          {
            default_payment_method: paymentMethod.stripePaymentMethodId,
          },
        );
      }

      donation.paymentMethodId = dto.paymentMethodId;
    }

    // If amount or frequency changed, need to update Stripe subscription
    if (dto.amount || dto.frequency) {
      const newAmount = dto.amount || Number(donation.amount);
      const newFrequency = dto.frequency || donation.frequency;

      // Get cause for product name
      const cause = donation.causeId
        ? await this.causeRepository.findOne({
            where: { id: donation.causeId },
          })
        : null;

      // Create new price
      const { priceId } = await this.createStripeProductAndPrice(
        newAmount,
        newFrequency,
        cause?.title || 'General Fund',
      );

      // Update Stripe subscription
      if (donation.stripeSubscriptionId) {
        const subscription = await this.ensureStripe().subscriptions.retrieve(
          donation.stripeSubscriptionId,
        );
        const oldPriceId = subscription.items.data[0]?.price.id;

        await this.ensureStripe().subscriptions.update(
          donation.stripeSubscriptionId,
          {
            items: [{ id: subscription.items.data[0].id, price: priceId }],
            default_payment_method: donation.paymentMethodId
              ? (
                  await this.paymentMethodRepository.findOne({
                    where: { id: donation.paymentMethodId },
                  })
                )?.stripePaymentMethodId
              : undefined,
          },
        );

        // Archive old price
        if (oldPriceId) {
          await this.ensureStripe()
            .prices.update(oldPriceId, { active: false })
            .catch(() => {});
        }
      }

      donation.amount = newAmount;
      donation.frequency = newFrequency;
      donation.nextDonationDate = this.calculateNextDonationDate(newFrequency);
    }

    const saved = await this.recurringDonationRepository.save(donation);
    this.logger.log(`Updated recurring donation ${saved.id}`);

    return this.findOne(userId, saved.id);
  }

  /**
   * Pause a recurring donation
   */
  async pause(userId: number, id: number): Promise<RecurringDonation> {
    const donation = await this.findOne(userId, id);

    if (donation.status !== 'active') {
      throw new BadRequestException('Can only pause active subscriptions');
    }

    // Pause Stripe subscription
    if (donation.stripeSubscriptionId) {
      await this.ensureStripe().subscriptions.update(
        donation.stripeSubscriptionId,
        {
          pause_collection: { behavior: 'void' },
        },
      );
    }

    donation.status = 'paused';
    const saved = await this.recurringDonationRepository.save(donation);

    this.logger.log(`Paused recurring donation ${saved.id}`);
    return this.findOne(userId, saved.id);
  }

  /**
   * Resume a paused recurring donation
   */
  async resume(userId: number, id: number): Promise<RecurringDonation> {
    const donation = await this.findOne(userId, id);

    if (donation.status !== 'paused') {
      throw new BadRequestException('Can only resume paused subscriptions');
    }

    // Resume Stripe subscription
    if (donation.stripeSubscriptionId) {
      await this.ensureStripe().subscriptions.update(
        donation.stripeSubscriptionId,
        {
          pause_collection: '' as any, // Remove pause
        },
      );
    }

    donation.status = 'active';
    donation.nextDonationDate = this.calculateNextDonationDate(
      donation.frequency,
    );
    const saved = await this.recurringDonationRepository.save(donation);

    this.logger.log(`Resumed recurring donation ${saved.id}`);
    return this.findOne(userId, saved.id);
  }

  /**
   * Cancel a recurring donation
   */
  async cancel(
    userId: number,
    id: number,
  ): Promise<{ success: boolean; message: string }> {
    const donation = await this.findOne(userId, id);

    // Cancel Stripe subscription
    if (donation.stripeSubscriptionId) {
      await this.ensureStripe().subscriptions.cancel(
        donation.stripeSubscriptionId,
      );
    }

    donation.status = 'cancelled';
    await this.recurringDonationRepository.save(donation);

    this.logger.log(`Cancelled recurring donation ${donation.id}`);
    return {
      success: true,
      message: 'Recurring donation cancelled successfully',
    };
  }

  /**
   * Handle successful payment webhook - update donation stats
   */
  async handlePaymentSuccess(
    stripeSubscriptionId: string,
    amount: number,
  ): Promise<void> {
    const donation = await this.recurringDonationRepository.findOne({
      where: { stripeSubscriptionId },
    });

    if (!donation) {
      this.logger.warn(
        `No recurring donation found for subscription ${stripeSubscriptionId}`,
      );
      return;
    }

    donation.totalDonated = Number(donation.totalDonated) + amount;
    donation.donationCount += 1;
    donation.nextDonationDate = this.calculateNextDonationDate(
      donation.frequency,
    );

    await this.recurringDonationRepository.save(donation);
    this.logger.log(
      `Updated donation stats for recurring donation ${donation.id}`,
    );
  }

  /**
   * Handle payment failure webhook
   */
  async handlePaymentFailure(stripeSubscriptionId: string): Promise<void> {
    this.logger.warn(`Payment failed for subscription ${stripeSubscriptionId}`);
    // Could notify user, pause after X failures, etc.
  }

  /**
   * Handle subscription deleted webhook
   */
  async handleSubscriptionDeleted(stripeSubscriptionId: string): Promise<void> {
    const donation = await this.recurringDonationRepository.findOne({
      where: { stripeSubscriptionId },
    });

    if (donation) {
      donation.status = 'cancelled';
      await this.recurringDonationRepository.save(donation);
      this.logger.log(
        `Marked recurring donation ${donation.id} as cancelled via webhook`,
      );
    }
  }

  /**
   * Get user impact stats for recurring donations
   */
  async getUserRecurringStats(userId: number): Promise<{
    activeCount: number;
    pausedCount: number;
    totalMonthlyAmount: number;
    totalAnnualAmount: number;
  }> {
    const donations = await this.recurringDonationRepository.find({
      where: { userId },
    });

    const activeDonations = donations.filter((d) => d.status === 'active');
    const pausedDonations = donations.filter((d) => d.status === 'paused');

    // Calculate monthly equivalent
    const monthlyAmount = activeDonations.reduce((total, d) => {
      const multiplier =
        d.frequency === 'weekly'
          ? 4.33
          : d.frequency === 'monthly'
            ? 1
            : d.frequency === 'quarterly'
              ? 0.33
              : d.frequency === 'yearly'
                ? 0.083
                : 1;
      return total + Number(d.amount) * multiplier;
    }, 0);

    return {
      activeCount: activeDonations.length,
      pausedCount: pausedDonations.length,
      totalMonthlyAmount: Math.round(monthlyAmount * 100) / 100,
      totalAnnualAmount: Math.round(monthlyAmount * 12 * 100) / 100,
    };
  }
}
