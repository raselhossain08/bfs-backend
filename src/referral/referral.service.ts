import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Referral, ReferralStatus } from './entities/referral.entity';
import { User } from '../users/entities/user.entity';
import {
  SendInvitesDto,
  ReferralStatsDto,
  ReferralDto,
} from './dto/referral.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    @InjectRepository(Referral)
    private referralRepository: Repository<Referral>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private emailService: EmailService,
  ) {}

  /**
   * Generate a unique referral code for a user
   */
  async generateReferralCode(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.referralCode) {
      return user.referralCode;
    }

    // Generate unique code: prefix + random string
    const prefix = user.firstName?.substring(0, 3).toUpperCase() || 'REF';

    // Try up to 10 times to generate unique code
    for (let i = 0; i < 10; i++) {
      const code = `${prefix}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Check uniqueness
      const existing = await this.userRepository.findOne({
        where: { referralCode: code },
      });

      if (!existing) {
        user.referralCode = code;
        await this.userRepository.save(user);
        return code;
      }
    }

    // If we get here, we failed to generate a unique code after 10 attempts
    // This is extremely unlikely but we handle it gracefully
    this.logger.error(
      `Failed to generate unique referral code for user ${userId} after 10 attempts`,
    );
    throw new Error(
      'Failed to generate unique referral code. Please try again.',
    );
  }

  /**
   * Get or create referral code for a user
   */
  async getReferralCode(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.referralCode) {
      return user.referralCode;
    }

    return this.generateReferralCode(userId);
  }

  /**
   * Process a referral when a new user registers
   */
  async processReferral(
    newUserId: number,
    referralCode: string,
    email: string,
  ): Promise<Referral | null> {
    // Find the referrer by referral code
    const referrer = await this.userRepository.findOne({
      where: { referralCode },
    });

    if (!referrer) {
      this.logger.warn(`Invalid referral code: ${referralCode}`);
      return null;
    }

    // Prevent self-referral
    if (referrer.id === newUserId) {
      this.logger.warn(`User ${newUserId} attempted to refer themselves`);
      return null;
    }

    // Check if referral already exists (from email invite)
    let referral = await this.referralRepository.findOne({
      where: { email, referrerId: referrer.id },
    });

    if (referral) {
      // Update existing referral
      referral.referredUserId = newUserId;
      referral.status = ReferralStatus.JOINED;
      referral.joinedAt = new Date();
      await this.referralRepository.save(referral);
    } else {
      // Create new referral
      referral = this.referralRepository.create({
        referrerId: referrer.id,
        referredUserId: newUserId,
        email,
        referralCode: referralCode,
        status: ReferralStatus.JOINED,
        joinedAt: new Date(),
      });
      await this.referralRepository.save(referral);
    }

    // Update user's referredBy field
    await this.userRepository.update(newUserId, { referredBy: referrer.id });

    this.logger.log(
      `Processed referral: User ${newUserId} referred by ${referrer.id}`,
    );

    return referral;
  }

  /**
   * Update referral stats when a referred user makes a donation
   */
  async recordDonation(userId: number, amount: number): Promise<void> {
    try {
      const referral = await this.referralRepository.findOne({
        where: { referredUserId: userId },
      });

      if (!referral) {
        return; // User was not referred
      }

      // Update referral stats
      referral.totalDonated =
        parseFloat(referral.totalDonated.toString()) + amount;
      referral.donationCount += 1;
      referral.status = ReferralStatus.DONATED;
      await this.referralRepository.save(referral);

      this.logger.log(
        `Recorded donation for referral ${referral.id}: $${amount}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record donation for referral user ${userId}`,
        error,
      );
      // Don't rethrow - this is stats tracking that shouldn't block the donation flow
    }
  }

  /**
   * Get referral statistics for a user
   */
  async getStats(userId: number): Promise<ReferralStatsDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const referralCode = await this.getReferralCode(userId);

    // Get all referrals for this user
    const referrals = await this.referralRepository.find({
      where: { referrerId: userId },
    });

    const totalReferrals = referrals.length;
    const joinedReferrals = referrals.filter(
      (r) =>
        r.status === ReferralStatus.JOINED ||
        r.status === ReferralStatus.DONATED,
    ).length;
    const donatedReferrals = referrals.filter(
      (r) => r.status === ReferralStatus.DONATED,
    ).length;
    const totalReferredDonations = referrals.reduce(
      (sum, r) => sum + parseFloat(r.totalDonated.toString()),
      0,
    );

    // Calculate badges
    const badges = this.calculateBadges(totalReferrals, totalReferredDonations);

    return {
      totalReferrals,
      joinedReferrals,
      donatedReferrals,
      totalReferredDonations,
      referralCode,
      badges,
    };
  }

  /**
   * Get list of referrals for a user
   */
  async getReferrals(userId: number): Promise<ReferralDto[]> {
    const referrals = await this.referralRepository.find({
      where: { referrerId: userId },
      order: { createdAt: 'DESC' },
    });

    // Get referred user details
    const userIds = referrals
      .filter((r) => r.referredUserId)
      .map((r) => r.referredUserId);

    // Handle empty userIds array to avoid SQL syntax error
    let userMap = new Map();
    if (userIds.length > 0) {
      const users = await this.userRepository
        .createQueryBuilder('user')
        .where('user.id IN (:...userIds)', { userIds })
        .getMany();
      userMap = new Map(users.map((u) => [u.id, u]));
    }

    return referrals.map((r) => ({
      id: r.id,
      email: r.email,
      name:
        r.referredUserId && userMap.get(r.referredUserId)
          ? `${userMap.get(r.referredUserId)!.firstName || ''} ${userMap.get(r.referredUserId)!.lastName || ''}`.trim() ||
            r.email
          : r.email,
      status: r.status as 'pending' | 'joined' | 'donated',
      joinedAt: r.joinedAt?.toISOString(),
      totalDonated: parseFloat(r.totalDonated.toString()),
      donationCount: r.donationCount,
    }));
  }

  /**
   * Send referral invitations via email
   */
  async sendInvites(
    userId: number,
    dto: SendInvitesDto,
  ): Promise<{ sent: number; failed: number }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const referralCode = await this.getReferralCode(userId);
    const referrerName =
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'A friend';

    let sent = 0;
    let failed = 0;

    for (const email of dto.emails) {
      try {
        // Create pending referral record
        const existingReferral = await this.referralRepository.findOne({
          where: { email, referrerId: userId },
        });

        if (!existingReferral) {
          const referral = this.referralRepository.create({
            referrerId: userId,
            email,
            referralCode,
            status: ReferralStatus.PENDING,
          });
          await this.referralRepository.save(referral);
        }

        // Send invitation email
        await this.emailService.sendReferralInvite(
          email,
          referrerName,
          referralCode,
          dto.message,
        );

        sent++;
      } catch (error) {
        this.logger.error(
          `Failed to send invite to ${email}: ${error.message}`,
        );
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Calculate earned badges based on referral stats
   */
  private calculateBadges(
    totalReferrals: number,
    totalDonations: number,
  ): string[] {
    const badges: string[] = [];

    if (totalReferrals >= 1) badges.push('first-friend');
    if (totalReferrals >= 5) badges.push('rising-star');
    if (totalReferrals >= 10) badges.push('champion');
    if (totalReferrals >= 25) badges.push('legend');
    if (totalDonations >= 500) badges.push('impact-maker');
    if (totalDonations >= 1000) badges.push('change-agent');

    return badges;
  }

  /**
   * Get leaderboard of top referrers
   */
  async getLeaderboard(limit: number = 10): Promise<
    Array<{
      userId: number;
      name: string;
      referrals: number;
      donations: number;
    }>
  > {
    const result = await this.referralRepository
      .createQueryBuilder('referral')
      .select('referral.referrerId', 'userId')
      .addSelect('COUNT(*)', 'referrals')
      .addSelect('SUM(referral.totalDonated)', 'donations')
      .innerJoin('user', 'u', 'u.id = referral.referrerId')
      .groupBy('referral.referrerId')
      .orderBy('donations', 'DESC')
      .addOrderBy('referrals', 'DESC')
      .limit(limit)
      .getRawMany();

    // Get user names
    const userIds = result.map((r) => r.userId);

    // Handle empty userIds array to avoid SQL syntax error
    let userMap = new Map();
    if (userIds.length > 0) {
      const users = await this.userRepository
        .createQueryBuilder('user')
        .where('user.id IN (:...ids)', { ids: userIds })
        .getMany();
      userMap = new Map(users.map((u) => [u.id, u]));
    }

    return result.map((r) => ({
      userId: r.userId,
      name: userMap.get(r.userId)
        ? `${userMap.get(r.userId)!.firstName || ''} ${userMap.get(r.userId)!.lastName || ''}`.trim() ||
          'Anonymous'
        : 'Anonymous',
      referrals: parseInt(r.referrals) || 0,
      donations: parseFloat(r.donations) || 0,
    }));
  }

  /**
   * Validate a referral code
   */
  async validateCode(code: string): Promise<boolean> {
    if (!code || code.trim().length === 0) {
      return false;
    }
    const user = await this.userRepository.findOne({
      where: { referralCode: code.trim().toUpperCase() },
    });
    return !!user;
  }

  /**
   * Get all referrals (admin)
   */
  async getAllReferrals(options: {
    page: number;
    limit: number;
  }): Promise<{ referrals: Referral[]; total: number }> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [referrals, total] = await this.referralRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { referrals, total };
  }

  /**
   * Get referral system stats (admin)
   */
  async getSystemStats(): Promise<{
    totalReferrals: number;
    totalReferrers: number;
    joinedCount: number;
    donatedCount: number;
    totalReferredDonations: number;
    averageDonationPerReferral: number;
  }> {
    const totalReferrals = await this.referralRepository.count();

    const totalReferrersResult = await this.referralRepository
      .createQueryBuilder('referral')
      .select('COUNT(DISTINCT referral.referrerId)', 'count')
      .getRawOne();

    const joinedCount = await this.referralRepository.count({
      where: [
        { status: ReferralStatus.JOINED },
        { status: ReferralStatus.DONATED },
      ],
    });

    const donatedCount = await this.referralRepository.count({
      where: { status: ReferralStatus.DONATED },
    });

    const totalReferredDonationsResult = await this.referralRepository
      .createQueryBuilder('referral')
      .select('SUM(referral.totalDonated)', 'total')
      .getRawOne();

    const totalReferredDonations = parseFloat(
      totalReferredDonationsResult?.total || '0',
    );
    const averageDonationPerReferral =
      donatedCount > 0 ? totalReferredDonations / donatedCount : 0;

    return {
      totalReferrals,
      totalReferrers: parseInt(totalReferrersResult?.count || '0'),
      joinedCount,
      donatedCount,
      totalReferredDonations,
      averageDonationPerReferral:
        Math.round(averageDonationPerReferral * 100) / 100,
    };
  }
}
