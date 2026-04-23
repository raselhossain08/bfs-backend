import { Controller, Get, Query, Logger, Post, Body, UseGuards } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('stripe')
export class StripeSessionController {
    private readonly logger = new Logger(StripeSessionController.name);
    
    constructor(private readonly stripeService: StripeService) {}

    /**
     * Get Stripe payouts (admin only)
     * GET /api/stripe/payouts
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin', 'super-admin')
    @Get('payouts')
    async getPayouts(@Query('limit') limit?: string) {
        try {
            const payouts = await this.stripeService.getPayouts(limit ? parseInt(limit, 10) : 10);
            return {
                success: true,
                data: payouts,
            };
        } catch (error) {
            this.logger.error(`Failed to get payouts: ${error.message}`);
            return {
                success: false,
                message: 'Failed to fetch payouts from Stripe',
                error: error.message,
            };
        }
    }

    /**
     * Get Stripe balance (admin only)
     * GET /api/stripe/balance
     */
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin', 'super-admin')
    @Get('balance')
    async getBalance() {
        try {
            const balance = await this.stripeService.getBalance();
            return {
                success: true,
                data: balance,
            };
        } catch (error) {
            this.logger.error(`Failed to get balance: ${error.message}`);
            return {
                success: false,
                message: 'Failed to fetch balance from Stripe',
                error: error.message,
            };
        }
    }

    /**
     * Verify Stripe checkout session, save donation to database, and return details
     * GET /api/stripe/verify-session?session_id=cs_test_xxx
     */
    @Get('verify-session')
    async verifySession(@Query('session_id') sessionId: string) {
        if (!sessionId) {
            return { success: false, message: 'Session ID is required' };
        }

        try {
            const session = await this.stripeService.getCheckoutSession(sessionId);
            
            if (!session) {
                return { success: false, message: 'Session not found' };
            }

            // If payment is paid, save donation to database (for local dev where webhooks don't reach)
            if (session.payment_status === 'paid') {
                try {
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
                    this.logger.log(`Donation saved for session ${sessionId}`);
                } catch (saveError) {
                    // Donation might already exist, log but don't fail
                    this.logger.warn(`Could not save donation: ${saveError.message}`);
                }
            }

            // Format amount (Stripe amounts are in cents)
            const amount = session.amount_total ? session.amount_total / 100 : 0;
            const currency = session.currency?.toUpperCase() || 'USD';

            // Currency symbol map for multi-currency support
            const currencySymbols: Record<string, string> = {
                'USD': '$',
                'EUR': '€',
                'GBP': '£',
                'CAD': 'C$',
                'AUD': 'A$',
                'JPY': '¥',
                'CHF': 'Fr',
                'SEK': 'kr',
                'NOK': 'kr',
                'DKK': 'kr',
                'NZD': 'NZ$',
                'SGD': 'S$',
                'HKD': 'HK$',
            };
            const symbol = currencySymbols[currency] || currency;

            return {
                success: true,
                data: {
                    sessionId: session.id,
                    amount: amount,
                    currency: currency,
                    amountFormatted: `${symbol}${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    status: session.payment_status,
                    donorEmail: session.customer_details?.email || session.metadata?.donorEmail,
                    donorName: session.customer_details?.name || session.metadata?.donorName,
                    campaignName: session.metadata?.campaignName || 'General Donation',
                    campaignId: session.metadata?.campaignId,
                    createdAt: new Date(session.created * 1000).toISOString(),
                    receiptUrl: session.receipt_url,
                },
            };
        } catch (error) {
            return { 
                success: false, 
                message: 'Failed to verify session',
                error: error.message 
            };
        }
    }
}
