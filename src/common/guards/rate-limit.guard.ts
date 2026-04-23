import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { ThrottlerStorage } from '@nestjs/throttler';

// Rate limit configuration
export const RATE_LIMIT_CONFIG = {
    // Default limits
    default: { limit: 100, ttl: 60 }, // 100 requests per minute

    // Auth endpoints - stricter limits
    auth: { limit: 5, ttl: 60 }, // 5 requests per minute for login
    authPassword: { limit: 3, ttl: 60 }, // 3 requests per minute for password reset

    // Admin endpoints
    admin: { limit: 50, ttl: 60 }, // 50 requests per minute

    // API endpoints
    api: { limit: 200, ttl: 60 }, // 200 requests per minute
};

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
    constructor(
        options: any,
        storageService: ThrottlerStorage,
        reflector: Reflector,
    ) {
        super(options, storageService, reflector);
    }

    protected async throwThrottlingException(
        context: ExecutionContext,
        throttlerLimitDetail: ThrottlerLimitDetail,
    ): Promise<void> {
        const response = context.switchToHttp().getResponse();

        response.header('X-RateLimit-Limit', throttlerLimitDetail.limit);
        response.header('X-RateLimit-Remaining', 0);
        response.header('X-RateLimit-Reset', Math.ceil(throttlerLimitDetail.ttl / 1000));

        throw new HttpException(
            {
                statusCode: HttpStatus.TOO_MANY_REQUESTS,
                message: 'Too many requests. Please try again later.',
                error: 'Rate Limit Exceeded',
                retryAfter: Math.ceil(throttlerLimitDetail.ttl / 1000),
            },
            HttpStatus.TOO_MANY_REQUESTS,
        );
    }
}

// Decorator for custom rate limits
import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export const RateLimit = (limit: number, ttl: number = 60) =>
    SetMetadata(RATE_LIMIT_KEY, { limit, ttl });