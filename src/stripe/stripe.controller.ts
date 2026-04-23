import { Controller, Post, Body, Headers, Logger, Req } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

type StripeInstance = InstanceType<typeof Stripe>;

@Controller('webhooks/stripe')
export class StripeController {
    private readonly logger = new Logger(StripeController.name);
    private readonly webhookSecret: string;
    private stripe: StripeInstance;

    constructor(
        private readonly stripeService: StripeService,
        private readonly configService: ConfigService,
    ) {
        this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
        const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
        this.stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2026-03-25.dahlia' as any,
        });
    }

    /**
     * POST /api/webhooks/stripe
     * Stripe sends events here after payment events.
     * Add this URL in Stripe Dashboard > Webhooks:
     *   https://your-api-domain.com/api/webhooks/stripe
     */
    @Post()
    async handleStripeWebhook(
        @Headers('stripe-signature') signature: string,
        @Body() body: any,
    ): Promise<{ received: boolean }> {
        let event: any = body;

        // Verify webhook signature using official Stripe method (skip in dev if no secret set)
        if (this.webhookSecret && signature && this.stripe) {
            try {
                const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
                event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
                this.logger.log('Webhook signature verified successfully');
            } catch (err) {
                this.logger.error(`Webhook signature verification failed: ${err.message}`);
                return { received: false };
            }
        } else {
            this.logger.warn('Webhook signature verification skipped (dev mode or no Stripe configured)');
        }

        this.logger.log(`Stripe webhook received: ${event.type}`);

        try {
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data?.object;
                    if (session?.payment_status === 'paid') {
                        await this.stripeService.handleCheckoutSessionCompleted({
                            sessionId: session.id,
                            amount: session.amount_total || 0,
                            currency: session.currency || 'usd',
                            donorId: session.metadata?.donorId,
                            donorName: session.metadata?.donorName,
                            donorEmail: session.metadata?.donorEmail,
                            campaignId: session.metadata?.campaignId,
                            campaignName: session.metadata?.campaignName,
                            motivation: session.metadata?.motivation,
                        });
                    }
                    break;
                }

                case 'payment_intent.succeeded': {
                    const intent = event.data?.object;
                    this.logger.log(`PaymentIntent succeeded: ${intent.id}`);
                    // Already handled via checkout.session.completed for Checkout mode
                    break;
                }

                case 'payment_intent.payment_failed': {
                    const intent = event.data?.object;
                    await this.stripeService.handlePaymentIntentFailed({
                        sessionId: intent.id,
                        amount: intent.amount,
                        donorId: intent.metadata?.donorId,
                        donorName: intent.metadata?.donorName,
                        donorEmail: intent.metadata?.donorEmail,
                        campaignId: intent.metadata?.campaignId,
                        campaignName: intent.metadata?.campaignName,
                        motivation: intent.metadata?.motivation,
                    });
                    break;
                }

                default:
                    this.logger.log(`Unhandled event type: ${event.type}`);
            }
        } catch (error) {
            this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
        }

        return { received: true };
    }
}
