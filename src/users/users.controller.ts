import {
    Controller,
    Get,
    Post,
    Patch,
    Query,
    UseGuards,
    Request,
    Body,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CausesService } from '../causes/causes.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notifications.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

/**
 * Users Controller
 * Handles user-specific routes like profile, impact, donations
 */
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly causesService: CausesService,
    ) {}

    private getUserId(req: any): number | null {
        return req.user?.userId || req.user?.sub || req.user?.id;
    }

    /**
     * Get current user profile
     * GET /api/users/me
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    async getCurrentUser(@Request() req: any) {
        const userId = this.getUserId(req);
        if (!userId) {
            return { data: null, message: 'User not authenticated' };
        }

        const user = await this.usersService.findById(userId);
        if (!user) {
            return { data: null, message: 'User not found' };
        }

        // Remove sensitive data
        const { password, refreshToken, resetToken, resetTokenExpiry, twoFactorSecret, twoFactorBackupCodes, ...userData } = user as any;

        return { data: userData };
    }

    /**
     * Update current user profile
     * PATCH /api/users/me
     */
    @UseGuards(AuthGuard('jwt'))
    @Patch('me')
    async updateCurrentUser(
        @Request() req: any,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false })) dto: UpdateProfileDto,
    ) {
        const userId = this.getUserId(req);
        if (!userId) {
            return { data: null, message: 'User not authenticated', success: false };
        }

        // Update user
        const updated = await this.usersService.update(userId, dto);
        if (!updated) {
            return { data: null, message: 'User not found', success: false };
        }

        // Remove sensitive data from response
        const { password, refreshToken, resetToken, resetTokenExpiry, twoFactorSecret, twoFactorBackupCodes, ...userData } = updated as any;

        return { data: userData, success: true, message: 'Profile updated successfully' };
    }

    /**
     * Get notification preferences
     * GET /api/users/me/notifications
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('me/notifications')
    async getNotificationPreferences(@Request() req: any) {
        const userId = this.getUserId(req);
        if (!userId) {
            return { data: null, message: 'User not authenticated' };
        }

        const user = await this.usersService.findById(userId);
        if (!user) {
            return { data: null, message: 'User not found' };
        }

        // Return notification preferences or defaults
        const preferences = user.notificationPreferences || {
            emailReceipts: true,
            emailUpdates: true,
            emailMarketing: true,
            smsAlerts: false,
            loginAlerts: true,
            securityAlerts: true,
        };

        return { data: preferences };
    }

    /**
     * Update notification preferences
     * PATCH /api/users/me/notifications
     */
    @UseGuards(AuthGuard('jwt'))
    @Patch('me/notifications')
    async updateNotificationPreferences(
        @Request() req: any,
        @Body(new ValidationPipe({ whitelist: true })) dto: UpdateNotificationPreferencesDto,
    ) {
        const userId = this.getUserId(req);
        if (!userId) {
            return { data: null, message: 'User not authenticated', success: false };
        }

        const updated = await this.usersService.update(userId, {
            notificationPreferences: dto,
        });

        if (!updated) {
            return { data: null, message: 'User not found', success: false };
        }

        return { data: dto, success: true, message: 'Notification preferences updated' };
    }

    /**
     * Change user password
     * POST /api/users/me/change-password
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('me/change-password')
    async changePassword(
        @Request() req: any,
        @Body(new ValidationPipe({ whitelist: true })) dto: ChangePasswordDto,
    ) {
        const userId = this.getUserId(req);
        if (!userId) {
            return { success: false, message: 'User not authenticated' };
        }

        const result = await this.usersService.changePassword(userId, dto);
        return result;
    }

    /**
     * Upload avatar
     * POST /api/users/me/avatar
     */
    @UseGuards(AuthGuard('jwt'))
    @Post('me/avatar')
    async updateAvatar(
        @Request() req: any,
        @Body() body: { avatar: string },
    ) {
        const userId = this.getUserId(req);
        if (!userId) {
            return { data: null, message: 'User not authenticated', success: false };
        }

        const updated = await this.usersService.update(userId, { avatar: body.avatar });
        
        if (!updated) {
            return { data: null, message: 'User not found', success: false };
        }

        const { password, refreshToken, resetToken, resetTokenExpiry, twoFactorSecret, twoFactorBackupCodes, ...userData } = updated as any;

        return { data: userData, success: true, message: 'Avatar updated successfully' };
    }

    /**
     * Get user's donation impact stats
     * GET /api/users/me/impact
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('me/impact')
    async getUserImpact(@Request() req: any) {
        const userId = this.getUserId(req);
        if (!userId) {
            return { data: null, message: 'User not authenticated' };
        }

        const impact = await this.causesService.getUserImpact(userId);
        return { data: impact };
    }

    /**
     * Get user's donations with filtering
     * GET /api/users/me/donations?page=1&limit=20&status=completed&search=campaign&sort=date-desc
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('me/donations')
    async getUserDonations(
        @Request() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
        @Query('causeId') causeId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('sort') sort?: string,
    ) {
        const userId = this.getUserId(req);
        if (!userId) {
            return { data: [], total: 0, message: 'User not authenticated' };
        }

        const result = await this.causesService.getUserDonations(userId, {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            status,
            search,
            causeId,
            startDate,
            endDate,
            sort,
        });

        return result;
    }

    /**
     * Get user's donation streak
     * GET /api/users/me/streak
     */
    @UseGuards(AuthGuard('jwt'))
    @Get('me/streak')
    async getUserStreak(@Request() req: any) {
        const userId = this.getUserId(req);
        if (!userId) {
            return { 
                data: { 
                    currentStreak: 0, 
                    longestStreak: 0, 
                    weekActivity: [],
                    daysLeftInMonth: 0 
                }, 
                message: 'User not authenticated' 
            };
        }

        const impact = await this.causesService.getUserImpact(userId);
        
        // Calculate streak from donation dates
        const donations = impact.donations || [];
        const completedDonations = donations.filter((d: any) => d.status === 'completed');
        
        // Get unique dates with donations
        const donationDates = new Set(
            completedDonations.map((d: any) => new Date(d.createdAt).toDateString())
        );

        // Calculate current streak
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check for consecutive days
        const dates = Array.from(donationDates).map(d => new Date(d).getTime()).sort((a, b) => a - b);
        
        // Calculate current streak (from today backwards)
        let checkDate = new Date(today);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // If no donation today, check if there was one yesterday to continue streak
        if (!donationDates.has(checkDate.toDateString())) {
            if (!donationDates.has(yesterday.toDateString())) {
                // Streak broken - calculate how many consecutive days before break
                checkDate = yesterday;
            }
        }

        // Count backwards from checkDate
        while (donationDates.has(checkDate.toDateString())) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Calculate longest streak
        if (dates.length > 0) {
            let currentCount = 1;
            for (let i = 1; i < dates.length; i++) {
                const diff = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    currentCount++;
                    longestStreak = Math.max(longestStreak, currentCount);
                } else {
                    currentCount = 1;
                }
            }
            longestStreak = Math.max(longestStreak, currentCount, currentStreak);
        }

        // Generate week activity
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentDay = today.getDay();
        const weekActivity: { day: string; date: string; active: boolean }[] = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            const diff = i - currentDay;
            date.setDate(today.getDate() + diff);

            weekActivity.push({
                day: days[i],
                date: date.getDate().toString(),
                active: donationDates.has(date.toDateString()),
            });
        }

        // Reorder to start from Monday
        const mondayFirst = [...weekActivity.slice(1), weekActivity[0]];

        // Calculate days left in month
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysLeftInMonth = Math.ceil(
            (lastDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        return {
            data: {
                currentStreak,
                longestStreak,
                weekActivity: mondayFirst,
                daysLeftInMonth,
            },
        };
    }
}