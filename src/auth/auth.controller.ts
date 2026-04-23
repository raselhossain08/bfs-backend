import { Controller, Request, Post, UseGuards, Body, Get, Res, HttpCode, HttpStatus, Patch, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import type { Response } from 'express';

const COOKIE_SECURE = process.env.NODE_ENV === 'production';
const COOKIE_SAME_SITE: 'lax' | 'strict' | 'none' = 'lax';
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
        maxAge: ACCESS_TOKEN_MAX_AGE,
        path: '/',
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
        maxAge: REFRESH_TOKEN_MAX_AGE,
        path: '/',
    });
}

function clearAuthCookies(res: Response) {
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
        path: '/',
    });
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAME_SITE,
        path: '/',
    });
}

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @UseGuards(AuthGuard('local'))
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Request() req: any, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.login(req.user);
        setAuthCookies(res, result.access_token, result.refresh_token);
        return { user: result.user, access_token: result.access_token, refresh_token: result.refresh_token };
    }

    @Post('register')
    async register(@Body() body: any) {
        return this.authService.register(body);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Request() req: any, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            clearAuthCookies(res);
            res.status(HttpStatus.UNAUTHORIZED).json({
                statusCode: 401,
                message: 'No refresh token found. Please log in again.',
            });
            return;
        }

        try {
            const decoded = JSON.parse(
                Buffer.from(refreshToken.split('.')[1], 'base64').toString(),
            );
            const result = await this.authService.refreshTokens(decoded.sub, refreshToken);
            setAuthCookies(res, result.access_token, result.refresh_token);
            return { user: result.user, access_token: result.access_token, refresh_token: result.refresh_token };
        } catch {
            clearAuthCookies(res);
            res.status(HttpStatus.UNAUTHORIZED).json({
                statusCode: 401,
                message: 'Invalid session. Please log in again.',
            });
            return;
        }
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Request() req: any, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.refreshToken;

        if (refreshToken) {
            try {
                const decoded = JSON.parse(
                    Buffer.from(refreshToken.split('.')[1], 'base64').toString(),
                );
                await this.authService.logout(decoded.sub);
            } catch {
                // Silently ignore decode errors during logout
            }
        }

        clearAuthCookies(res);
        return { message: 'Logged out successfully.' };
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() body: { token: string; password: string }) {
        return this.authService.resetPassword(body.token, body.password);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('profile')
    getProfile(@Request() req: any) {
        return req.user;
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('profile')
    async updateProfile(@Request() req: any, @Body() body: any) {
        // JWT strategy returns userId, not id
        const userId = req.user.userId || req.user.id;
        return this.authService.updateProfile(userId, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    async changePassword(@Request() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
        return this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
    }

    @UseGuards(AuthGuard('jwt'))
    @Delete('account')
    @HttpCode(HttpStatus.OK)
    async deleteAccount(@Request() req: any) {
        return this.authService.deleteAccount(req.user.id);
    }

    // ─────────────────────────────────────────────────────────────────
    // OTP Login Endpoints
    // ─────────────────────────────────────────────────────────────────

    @Post('login-otp/send')
    @HttpCode(HttpStatus.OK)
    async sendOTPLogin(@Body() dto: SendOtpDto) {
        return this.authService.sendOTPLogin(dto.email);
    }

    @Post('login-otp/verify')
    @HttpCode(HttpStatus.OK)
    async verifyOTPLogin(@Body() dto: VerifyOtpDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.verifyOTPLogin(dto.email, dto.otp);
        setAuthCookies(res, result.access_token, result.refresh_token);
        return { user: result.user, access_token: result.access_token, refresh_token: result.refresh_token };
    }
}