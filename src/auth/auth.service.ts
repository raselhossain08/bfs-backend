import { Injectable, UnauthorizedException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { ReferralService } from '../referral/referral.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private emailService: EmailService,
        @Inject(forwardRef(() => ReferralService))
        private referralService: ReferralService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(email);
        if (user && user.password && (await bcrypt.compare(pass, user.password))) {
            const { password, resetToken, resetTokenExpiry, refreshToken, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        // Store hashed refresh token in DB and update lastActive
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.usersService.update(user.id, {
            refreshToken: hashedRefreshToken,
            lastActive: new Date(),
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                avatar: user.avatar,
            },
        };
    }

    async refreshTokens(userId: number, refreshToken: string) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.refreshToken) {
            throw new UnauthorizedException('Access denied — no active session.');
        }

        const tokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!tokenMatches) {
            throw new UnauthorizedException('Session expired. Please log in again.');
        }

        const payload = { email: user.email, sub: user.id, role: user.role };
        const newAccessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
        await this.usersService.update(user.id, { refreshToken: hashedRefreshToken });

        return {
            access_token: newAccessToken,
            refresh_token: newRefreshToken,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                avatar: user.avatar,
            },
        };
    }

    async logout(userId: number) {
        await this.usersService.update(userId, { refreshToken: undefined });
        return { message: 'Logged out successfully.' };
    }

    async register(userData: any) {
        this.logger.log(`Registration attempt for email: ${userData.email}`);
        
        const existingUser = await this.usersService.findOne(userData.email);
        if (existingUser) {
            this.logger.warn(`Registration failed: Email ${userData.email} already exists`);
            throw new BadRequestException('An account with this email already exists.');
        }

        if (!userData.password || userData.password.length < 6) {
            this.logger.warn('Registration failed: Password too short');
            throw new BadRequestException('Password must be at least 6 characters long.');
        }

        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            this.logger.log(`Creating user with email: ${userData.email}`);
            
            const user = await this.usersService.create({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                password: hashedPassword,
            });
            
            this.logger.log(`User created successfully with ID: ${user.id}`);

            // Process referral code if provided
            if (userData.referralCode) {
                try {
                    await this.referralService.processReferral(
                        user.id,
                        userData.referralCode,
                        userData.email,
                    );
                    this.logger.log(`Processed referral for new user ${user.id} with code ${userData.referralCode}`);
                } catch (error) {
                    // Log error but don't fail registration
                    this.logger.warn(`Failed to process referral for user ${user.id}: ${error.message}`);
                }
            }

            // Generate referral code for the new user
            try {
                await this.referralService.generateReferralCode(user.id);
            } catch (error) {
                this.logger.warn(`Failed to generate referral code for user ${user.id}: ${error.message}`);
            }

            const { password, resetToken, resetTokenExpiry, refreshToken, ...result } = user;
            return result;
        } catch (error) {
            this.logger.error(`Registration failed with error: ${error.message}`, error.stack);
            throw new BadRequestException(`Registration failed: ${error.message}`);
        }
    }

    async forgotPassword(email: string) {
        const user = await this.usersService.findOne(email);

        // Always return success to prevent email enumeration attacks
        if (!user) {
            return {
                message: 'If an account with that email exists, a password reset link has been sent.',
            };
        }

        // Generate a cryptographically secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        await this.usersService.update(user.id, {
            resetToken,
            resetTokenExpiry,
        });

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

        // Send password reset email
        const userName = user.firstName || user.email.split('@')[0];
        const emailSent = await this.emailService.sendPasswordResetEmail(
            user.email,
            userName,
            resetLink
        );

        if (!emailSent) {
            this.logger.error(`Failed to send password reset email to ${user.email}`);
        } else {
            this.logger.log(`Password reset email sent successfully to ${user.email}`);
        }

        return {
            message: 'If an account with that email exists, a password reset link has been sent.',
            // Only include in development — remove in production!
            ...(process.env.NODE_ENV !== 'production' && { resetLink }),
        };
    }

    async resetPassword(token: string, newPassword: string) {
        if (!token) {
            throw new BadRequestException('Reset token is required.');
        }

        if (!newPassword || newPassword.length < 6) {
            throw new BadRequestException('Password must be at least 6 characters long.');
        }

        const user = await this.usersService.findByResetToken(token);
        if (!user) {
            throw new BadRequestException('Invalid or expired reset token. Please request a new one.');
        }

        if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
            // Clear expired token
            await this.usersService.update(user.id, {
                resetToken: undefined,
                resetTokenExpiry: undefined,
            });
            throw new BadRequestException('Reset token has expired. Please request a new password reset.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.update(user.id, {
            password: hashedPassword,
            resetToken: undefined,
            resetTokenExpiry: undefined,
        });

        return { message: 'Password has been reset successfully. You can now log in with your new password.' };
    }

    async updateProfile(userId: number, updateData: any) {
        // Filter out fields that shouldn't be updated directly
        const allowedFields = [
            'firstName',
            'lastName',
            'email',
            'avatar',
            'phone',
            'bio',
            'timezone',
            'language',
            'address',
            'city',
            'country',
            'notificationPreferences',
        ];
        const filteredData: any = {};

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                filteredData[field] = updateData[field];
            }
        }

        // If email is being updated, check for duplicates (but skip if it's the same user)
        if (filteredData.email) {
            const existingUser = await this.usersService.findOne(filteredData.email);
            // Only throw error if email exists AND belongs to a different user
            // Convert both IDs to numbers for comparison
            if (existingUser && Number(existingUser.id) !== Number(userId)) {
                throw new BadRequestException('An account with this email already exists.');
            }
        }

        const updatedUser = await this.usersService.update(userId, filteredData);
        if (!updatedUser) {
            throw new BadRequestException('Failed to update profile.');
        }
        const { password, resetToken, resetTokenExpiry, refreshToken, ...result } = updatedUser;
        return result;
    }

    async changePassword(userId: number, currentPassword: string, newPassword: string) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.password) {
            throw new BadRequestException('User not found.');
        }

        // Verify current password
        const passwordMatches = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatches) {
            throw new BadRequestException('Current password is incorrect.');
        }

        if (!newPassword || newPassword.length < 6) {
            throw new BadRequestException('New password must be at least 6 characters long.');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.update(userId, { password: hashedPassword });

        return { message: 'Password changed successfully.' };
    }

    async deleteAccount(userId: number) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new BadRequestException('User not found.');
        }

        // Soft delete by setting status to 'deleted'
        await this.usersService.update(userId, {
            status: 'deleted',
            refreshToken: undefined,
        });

        this.logger.log(`Account deleted for user ${userId}`);

        return { message: 'Account scheduled for deletion.' };
    }

    // ─────────────────────────────────────────────────────────────────
    // OTP Login Methods
    // ─────────────────────────────────────────────────────────────────

    private generateOTP(): string {
        const buffer = crypto.randomBytes(3);
        return (100000 + (buffer.readUIntBE(0, 3) % 900000)).toString();
    }

    private static readonly MAX_OTP_ATTEMPTS = 5;
    private static readonly OTP_ATTEMPTS_WINDOW_MS = 10 * 60 * 1000; // 10 min

    async sendOTPLogin(email: string) {
        const user = await this.usersService.findOne(email);

        if (!user) {
            return { message: 'If an account with that email exists, an OTP has been sent.' };
        }

        if (user.status !== 'active') {
            throw new UnauthorizedException('Account is not active. Please contact support.');
        }

        // Rate-limit: prevent OTP spam (1 per minute per email)
        if (user.otpLoginExpiry && user.otpLoginCode) {
            const timeSinceLastOtp = Date.now() - (user.otpLoginExpiry.getTime() - 10 * 60 * 1000);
            if (timeSinceLastOtp < 60 * 1000) {
                throw new BadRequestException('Please wait 60 seconds before requesting a new OTP.');
            }
        }

        const otp = this.generateOTP();
        const hashedOtp = await bcrypt.hash(otp, 10);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        await this.usersService.update(user.id, {
            otpLoginCode: hashedOtp,
            otpLoginExpiry: otpExpiry,
            otpAttempts: 0,
            otpAttemptsResetAt: new Date(),
        });

        const userName = user.firstName || user.email.split('@')[0];
        const emailSent = await this.emailService.sendOTPLoginEmail(
            user.email,
            userName,
            otp,
        );

        if (!emailSent) {
            this.logger.error(`Failed to send OTP login email to ${user.email}`);
        } else {
            this.logger.log(`OTP login email sent to ${user.email}`);
        }

        return {
            message: 'If an account with that email exists, an OTP has been sent.',
            ...(process.env.NODE_ENV !== 'production' && { otp }),
        };
    }

    async verifyOTPLogin(email: string, otp: string) {
        if (!otp || !/^\d{6}$/.test(otp)) {
            throw new BadRequestException('Invalid OTP format. Please enter the 6-digit code.');
        }

        const user = await this.usersService.findOne(email);

        if (!user || !user.otpLoginCode || !user.otpLoginExpiry) {
            throw new BadRequestException('Invalid or expired OTP. Please request a new one.');
        }

        // Check max attempts
        if (
            user.otpAttempts >= AuthService.MAX_OTP_ATTEMPTS &&
            user.otpAttemptsResetAt &&
            Date.now() - user.otpAttemptsResetAt.getTime() < AuthService.OTP_ATTEMPTS_WINDOW_MS
        ) {
            throw new BadRequestException('Too many failed attempts. Please request a new OTP.');
        }

        // Check expiry
        if (new Date() > user.otpLoginExpiry) {
            await this.usersService.update(user.id, {
                otpLoginCode: undefined,
                otpLoginExpiry: undefined,
                otpAttempts: 0,
            });
            throw new BadRequestException('OTP has expired. Please request a new one.');
        }

        // Verify hashed OTP
        const otpValid = await bcrypt.compare(otp, user.otpLoginCode);
        if (!otpValid) {
            const newAttempts = (user.otpAttempts || 0) + 1;
            await this.usersService.update(user.id, { otpAttempts: newAttempts });
            throw new BadRequestException('Invalid OTP. Please try again.');
        }

        // OTP is valid — clear it and reset attempts
        await this.usersService.update(user.id, {
            otpLoginCode: undefined,
            otpLoginExpiry: undefined,
            otpAttempts: 0,
            otpAttemptsResetAt: undefined,
            lastActive: new Date(),
        });

        const { password, resetToken, resetTokenExpiry, refreshToken, otpLoginCode, otpLoginExpiry, otpAttempts, otpAttemptsResetAt, ...loginUser } = user;
        return this.login(loginUser);
    }
}
