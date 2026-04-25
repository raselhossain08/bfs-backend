import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from '../causes/entities/donation.entity';
import { User } from '../users/entities/user.entity';
import { Logger } from '@nestjs/common';

@Controller('donations/verify')
export class DonationVerificationController {
  private readonly logger = new Logger(DonationVerificationController.name);

  constructor(
    @InjectRepository(Donation)
    private donationRepository: Repository<Donation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Get donation statistics and health check
   * GET /api/donations/verify/stats
   */
  @Get('stats')
  async getDonationStats() {
    try {
      const totalDonations = await this.donationRepository.count();
      const completedDonations = await this.donationRepository.count({
        where: { status: 'completed' },
      });

      // Get all donations and count those with donorId
      const allDonations = await this.donationRepository.find({
        select: ['donorId'],
      });
      const withDonorId = allDonations.filter((d) => d.donorId !== null).length;
      const withoutDonorId = allDonations.filter(
        (d) => d.donorId === null,
      ).length;

      const recentDonations = await this.donationRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
      });

      return {
        success: true,
        data: {
          total: totalDonations,
          completed: completedDonations,
          withDonorId: withDonorId,
          withoutDonorId: withoutDonorId,
          recent: recentDonations.map((d) => ({
            id: d.id,
            amount: d.amount,
            donorId: d.donorId,
            status: d.status,
            createdAt: d.createdAt,
          })),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching donation stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify user donations are properly linked
   * GET /api/donations/verify/user/:userId
   */
  @Get('user/:userId')
  @UseGuards(AuthGuard('jwt'))
  async verifyUserDonations(
    @Request() req: any,
    @Query('userId') userId: string,
  ) {
    const requestingUserId = req.user?.userId || req.user?.sub || req.user?.id;

    // Users can only verify their own donations unless admin
    const isAdmin =
      req.user?.role === 'admin' || req.user?.role === 'super_admin';
    const targetUserId = isAdmin
      ? userId
        ? parseInt(userId, 10)
        : requestingUserId
      : requestingUserId;

    try {
      const user = await this.userRepository.findOne({
        where: { id: targetUserId },
      });
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const donations = await this.donationRepository.find({
        where: { donorId: targetUserId },
        order: { createdAt: 'DESC' },
      });

      return {
        success: true,
        data: {
          userId: targetUserId,
          userEmail: user.email,
          donationCount: donations.length,
          donations: donations.map((d) => ({
            id: d.id,
            amount: d.amount,
            currency: d.currency,
            causeName: d.causeName,
            status: d.status,
            createdAt: d.createdAt,
          })),
        },
      };
    } catch (error) {
      this.logger.error('Error verifying user donations:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test endpoint to simulate a donation webhook
   * POST /api/donations/verify/test-webhook
   */
  @Post('test-webhook')
  async testWebhook(@Body() body: any) {
    try {
      this.logger.log('Test webhook received:', body);

      // Simulate webhook processing
      const mockSession = {
        sessionId: body.sessionId || `test_${Date.now()}`,
        amount: body.amount || 1000,
        currency: body.currency || 'usd',
        donorId: body.donorId,
        donorName: body.donorName || 'Test Donor',
        donorEmail: body.donorEmail || 'test@example.com',
        campaignId: body.campaignId,
        campaignName: body.campaignName || 'Test Campaign',
        motivation: body.motivation || 'Test donation',
      };

      // Check if this would create a donation
      const wouldCreate = !(await this.donationRepository.findOne({
        where: { transactionId: mockSession.sessionId },
      }));

      return {
        success: true,
        message: 'Test webhook processed',
        data: {
          wouldCreateDonation: wouldCreate,
          sessionData: mockSession,
        },
      };
    } catch (error) {
      this.logger.error('Error in test webhook:', error);
      return { success: false, error: error.message };
    }
  }
}
