import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const SKIP_RATE_LIMIT_KEY = 'skipRateLimit';
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_KEY, true);

export const ADMIN_ONLY_KEY = 'adminOnly';
export const AdminOnly = () => SetMetadata(ADMIN_ONLY_KEY, true);

export const SUPER_ADMIN_ONLY_KEY = 'superAdminOnly';
export const SuperAdminOnly = () => SetMetadata(SUPER_ADMIN_ONLY_KEY, true);
