import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import Stripe from 'stripe';
import { PaymentMethod } from './entities/payment-method.entity';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from './dto/payment-method.dto';
import { User } from '../users/entities/user.entity';

type StripeInstance = InstanceType<typeof Stripe>;

@Injectable()
export class PaymentMethodsService {
  private readonly logger = new Logger(PaymentMethodsService.name);
  private stripe: StripeInstance | null = null;

  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {
    // Initialize Stripe with secret key
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
    if (!this.stripe) {
      throw new Error(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
      );
    }

    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    // Create new Stripe Customer
    const customer = await this.stripe.customers.create({
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
   * Get all payment methods for a user
   */
  async findAll(userId: number): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find({
      where: { userId },
      order: { isDefault: 'DESC' as any, createdAt: 'DESC' },
    });
  }

  /**
   * Get a single payment method by ID
   */
  async findOne(userId: number, id: number): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    if (paymentMethod.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this payment method',
      );
    }

    return paymentMethod;
  }

  /**
   * Create a new payment method from Stripe PaymentMethod ID
   */
  async create(
    userId: number,
    dto: CreatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    if (!this.stripe) {
      throw new Error(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
      );
    }

    // Get user with stripe customer
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get or create Stripe Customer
    const stripeCustomerId = await this.getOrCreateStripeCustomer(user);

    // Retrieve PaymentMethod from Stripe to get card details
    const stripePM = await this.stripe.paymentMethods.retrieve(
      dto.paymentMethodId,
    );

    if (stripePM.type !== 'card' || !stripePM.card) {
      throw new ForbiddenException('Only card payment methods are supported');
    }

    // Attach PaymentMethod to Stripe Customer
    await this.stripe.paymentMethods.attach(dto.paymentMethodId, {
      customer: stripeCustomerId,
    });

    // Check if this is the first payment method
    const existingCount = await this.paymentMethodRepository.count({
      where: { userId },
    });

    // Create payment method record
    const paymentMethod = this.paymentMethodRepository.create({
      userId,
      stripePaymentMethodId: dto.paymentMethodId,
      stripeCustomerId,
      type: 'card',
      brand: stripePM.card.brand,
      last4: stripePM.card.last4,
      expMonth: stripePM.card.exp_month,
      expYear: stripePM.card.exp_year,
      isDefault: existingCount === 0, // First card is default
      cardholderName: dto.cardholderName || undefined,
    });

    const saved = await this.paymentMethodRepository.save(paymentMethod);

    // If this is the first card, set as default in Stripe
    if (existingCount === 0) {
      await this.stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: dto.paymentMethodId,
        },
      });
    }

    this.logger.log(`Created payment method ${saved.id} for user ${userId}`);
    return saved;
  }

  /**
   * Update a payment method
   */
  async update(
    userId: number,
    id: number,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    const paymentMethod = await this.findOne(userId, id);

    if (dto.cardholderName !== undefined) {
      paymentMethod.cardholderName = dto.cardholderName;
    }

    return this.paymentMethodRepository.save(paymentMethod);
  }

  /**
   * Set a payment method as default
   */
  async setDefault(userId: number, id: number): Promise<PaymentMethod> {
    if (!this.stripe) {
      throw new Error(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
      );
    }

    const paymentMethod = await this.findOne(userId, id);

    // Get user for Stripe Customer ID
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !paymentMethod.stripeCustomerId) {
      throw new NotFoundException('User or Stripe customer not found');
    }

    // Update all payment methods to not be default
    await this.paymentMethodRepository.update({ userId }, { isDefault: false });

    // Set this one as default
    paymentMethod.isDefault = true;
    await this.paymentMethodRepository.save(paymentMethod);

    // Update Stripe customer default payment method
    await this.stripe.customers.update(paymentMethod.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.stripePaymentMethodId,
      },
    });

    this.logger.log(`Set payment method ${id} as default for user ${userId}`);
    return paymentMethod;
  }

  /**
   * Delete a payment method
   */
  async remove(userId: number, id: number): Promise<{ success: boolean }> {
    return await this.dataSource.transaction(async (manager) => {
      if (!this.stripe) {
        throw new Error(
          'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
        );
      }

      const paymentMethod = await manager.findOne(PaymentMethod, {
        where: { id, userId },
      });

      if (!paymentMethod) {
        throw new NotFoundException('Payment method not found');
      }

      // Detach from Stripe Customer (with proper error handling)
      let stripeDetachFailed = false;
      try {
        await this.stripe.paymentMethods.detach(
          paymentMethod.stripePaymentMethodId,
        );
      } catch (error) {
        this.logger.error(
          `Failed to detach payment method from Stripe: ${error.message}`,
          error.stack,
        );
        stripeDetachFailed = true;
        // Don't rollback - Stripe failure shouldn't block local deletion
        // But log it for manual review
      }

      // If this was the default, set another one as default
      if (paymentMethod.isDefault) {
        const nextDefault = await manager.findOne(PaymentMethod, {
          where: { userId },
          order: { createdAt: 'ASC' },
        });

        if (nextDefault) {
          nextDefault.isDefault = true;
          await manager.save(PaymentMethod, nextDefault);

          // Update Stripe default (best effort)
          if (nextDefault.stripeCustomerId) {
            try {
              await this.stripe.customers.update(
                nextDefault.stripeCustomerId,
                {
                  invoice_settings: {
                    default_payment_method: nextDefault.stripePaymentMethodId,
                  },
                },
              );
            } catch (error) {
              this.logger.warn(
                `Failed to update default payment method in Stripe: ${error.message}`,
              );
            }
          }
        }
      }

      await manager.remove(PaymentMethod, paymentMethod);

      this.logger.log(
        `Removed payment method ${id} for user ${userId}${stripeDetachFailed ? ' (Stripe detach failed - manual review needed)' : ''}`,
      );
      
      return { success: true };
    });
  }

  /**
   * Create a SetupIntent for saving a payment method without immediate charge
   */
  async createSetupIntent(userId: number): Promise<{ clientSecret: string }> {
    if (!this.stripe) {
      throw new Error(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get or create Stripe Customer
    const stripeCustomerId = await this.getOrCreateStripeCustomer(user);

    // Create SetupIntent
    const setupIntent = await this.stripe.setupIntents.create({
      customer: stripeCustomerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId.toString(),
      },
    });

    return { clientSecret: setupIntent.client_secret! };
  }

  /**
   * Sync payment methods from Stripe (useful for re-syncing)
   */
  async syncFromStripe(userId: number): Promise<PaymentMethod[]> {
    if (!this.stripe) {
      throw new Error(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.',
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.stripeCustomerId) {
      return [];
    }

    // List all payment methods from Stripe
    const stripePMs = await this.stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    // Get existing payment methods from DB
    const existingPMs = await this.paymentMethodRepository.find({
      where: { userId },
    });
    const existingIds = new Set(
      existingPMs.map((pm) => pm.stripePaymentMethodId),
    );

    // Add new payment methods from Stripe
    for (const stripePM of stripePMs.data) {
      if (!existingIds.has(stripePM.id) && stripePM.card) {
        const newPM = this.paymentMethodRepository.create({
          userId,
          stripePaymentMethodId: stripePM.id,
          stripeCustomerId: user.stripeCustomerId,
          type: 'card',
          brand: stripePM.card.brand,
          last4: stripePM.card.last4,
          expMonth: stripePM.card.exp_month,
          expYear: stripePM.card.exp_year,
          isDefault: false,
        });
        await this.paymentMethodRepository.save(newPM);
      }
    }

    // Remove payment methods no longer in Stripe
    for (const existingPM of existingPMs) {
      const stillExists = stripePMs.data.some(
        (sp) => sp.id === existingPM.stripePaymentMethodId,
      );
      if (!stillExists) {
        await this.paymentMethodRepository.remove(existingPM);
      }
    }

    return this.findAll(userId);
  }
}
