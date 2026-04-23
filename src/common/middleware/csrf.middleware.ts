import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createHash, randomBytes } from 'crypto';

// CSRF Token Store (in production, use Redis)
const csrfTokenStore = new Map<string, { token: string; expires: number }>();

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
    private readonly CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour
    private readonly EXEMPT_PATHS = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/refresh',
        '/api/auth/forgot-password',
        '/api/auth/reset-password',
        // Webhook paths
        '/api/webhooks',
        '/api/stripe/webhook',
    ];

    private readonly SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    use(req: Request, res: Response, next: NextFunction) {
        const path = req.path;

        // Skip CSRF for exempt paths
        if (this.EXEMPT_PATHS.some(exemptPath => path.startsWith(exemptPath))) {
            return next();
        }

        // Skip CSRF for safe methods (GET, HEAD, OPTIONS)
        if (this.SAFE_METHODS.includes(req.method)) {
            // Generate and attach CSRF token to response
            const existingToken = req.cookies?.['XSRF-TOKEN'];
            if (!existingToken) {
                const token = this.generateToken();
                res.cookie('XSRF-TOKEN', token, {
                    httpOnly: false, // Must be accessible to JavaScript
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: this.CSRF_TOKEN_EXPIRY,
                });
            }
            return next();
        }

        // For unsafe methods (POST, PUT, DELETE, PATCH), validate CSRF token
        const csrfToken = req.headers['x-xsrf-token'] || req.headers['x-csrf-token'] || req.body?._csrf;
        const cookieToken = req.cookies?.['XSRF-TOKEN'];

        if (!csrfToken || !cookieToken) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'CSRF token missing',
                    error: 'Forbidden',
                },
                HttpStatus.FORBIDDEN,
            );
        }

        // Validate tokens match
        if (csrfToken !== cookieToken) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'CSRF token mismatch',
                    error: 'Forbidden',
                },
                HttpStatus.FORBIDDEN,
            );
        }

        // Validate token hasn't expired
        const stored = csrfTokenStore.get(cookieToken);
        if (!stored || stored.expires < Date.now()) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.FORBIDDEN,
                    message: 'CSRF token expired',
                    error: 'Forbidden',
                },
                HttpStatus.FORBIDDEN,
            );
        }

        next();
    }

    private generateToken(): string {
        const token = randomBytes(32).toString('hex');
        csrfTokenStore.set(token, {
            token,
            expires: Date.now() + this.CSRF_TOKEN_EXPIRY,
        });

        // Clean up expired tokens periodically
        this.cleanupExpiredTokens();

        return token;
    }

    private cleanupExpiredTokens(): void {
        const now = Date.now();
        for (const [key, value] of csrfTokenStore.entries()) {
            if (value.expires < now) {
                csrfTokenStore.delete(key);
            }
        }
    }
}

// Helper function to get CSRF token for frontend
export function getCsrfToken(): string {
    return randomBytes(32).toString('hex');
}