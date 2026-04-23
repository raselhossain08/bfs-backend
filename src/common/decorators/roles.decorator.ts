import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route
 * @param roles Array of allowed roles
 * @example
 * @Roles('super_admin', 'admin', 'editor')
 * @UseGuards(AuthGuard('jwt'), RolesGuard)
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Admin roles - can view and edit most content
 */
export const ADMIN_ROLES = ['super_admin', 'admin', 'editor', 'manager'];

/**
 * Full admin only - for destructive operations
 */
export const FULL_ADMIN_ROLES = ['super_admin', 'admin'];

/**
 * Content editor roles - can create and edit content
 */
export const EDITOR_ROLES = ['super_admin', 'admin', 'editor'];
