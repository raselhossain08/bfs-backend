import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReferralService } from './referral.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, ADMIN_ROLES } from '../common/decorators/roles.decorator';
import { SendInvitesDto } from './dto/referral.dto';

/**
 * Referral Controller
 * Handles referral codes, invites, stats, and leaderboard
 * Base path: /api/referrals
 */
@Controller('referrals')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  // ============ PUBLIC ENDPOINTS ============

  /**
   * Validate a referral code (for registration form)
   * GET /api/referrals/validate/:code
   */
  @Get('validate/:code')
  async validateReferralCode(@Param('code') code: string) {
    const isValid = await this.referralService.validateCode(code);
    return { valid: isValid };
  }

  // ============ USER ENDPOINTS (Require Authentication) ============

  /**
   * Get user's referral stats
   * GET /api/referrals/stats
   * Legacy: /api/cms/referralStats
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('stats')
  async getReferralStats(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    const stats = await this.referralService.getStats(userId);
    return { data: stats };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('cms/referralStats')
  async getReferralStatsLegacy(@Request() req: any) {
    return this.getReferralStats(req);
  }

  /**
   * Get user's referrals
   * GET /api/referrals
   * Legacy: /api/cms/referrals
   */
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getReferrals(@Request() req: any) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    const referrals = await this.referralService.getReferrals(userId);
    return { data: referrals };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Get('cms/referrals')
  async getReferralsLegacy(@Request() req: any) {
    return this.getReferrals(req);
  }

  /**
   * Send referral invites
   * POST /api/referrals/invites
   * Legacy: /api/cms/sendInvites
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('invites')
  async sendInvites(@Request() req: any, @Body() dto: SendInvitesDto) {
    const userId = req.user?.userId || req.user?.sub || req.user?.id;
    const result = await this.referralService.sendInvites(userId, dto);
    return {
      success: true,
      sent: result.sent,
      failed: result.failed,
      message: `Sent ${result.sent} invitations${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
    };
  }

  /** @deprecated - Legacy route for backward compatibility */
  @UseGuards(AuthGuard('jwt'))
  @Post('cms/sendInvites')
  async sendInvitesLegacy(@Request() req: any, @Body() dto: SendInvitesDto) {
    return this.sendInvites(req, dto);
  }

  /**
   * Generate referral code for user
   * POST /api/referrals/generate-code
   * Legacy: /api/referrals/generate-code (same)
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('generate-code')
  async generateReferralCode(@Request() req: any) {
    const code = await this.referralService.generateReferralCode(
      req.user.userId,
    );
    return { success: true, code };
  }

  /**
   * Get referral leaderboard
   * GET /api/referrals/leaderboard?limit=10
   * Legacy: /api/referrals/leaderboard (same)
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('leaderboard')
  async getLeaderboard(@Query('limit') limit?: string) {
    const leaderboard = await this.referralService.getLeaderboard(
      limit ? parseInt(limit, 10) : 10,
    );
    return { data: leaderboard };
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * Get all referrals (admin)
   * GET /api/referrals/admin
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin')
  async getAllReferrals(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const referrals = await this.referralService.getAllReferrals({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return { data: referrals };
  }

  /**
   * Get referral system stats (admin)
   * GET /api/referrals/admin/stats
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Get('admin/stats')
  async getSystemStats() {
    const stats = await this.referralService.getSystemStats();
    return { data: stats };
  }
}
