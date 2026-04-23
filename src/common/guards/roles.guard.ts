import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard that checks if the user has one of the required roles
 * Must be used with @Roles() decorator
 * @example
 * @Roles('super_admin', 'admin')
 * @UseGuards(AuthGuard('jwt'), RolesGuard)
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        // Get required roles from metadata
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles are required, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // Get user from request
        const { user } = context.switchToHttp().getRequest();

        // Check if user exists and has a role
        if (!user || !user.role) {
            throw new ForbiddenException('Access denied');
        }

        // Check if user has one of the required roles
        const hasRole = requiredRoles.includes(user.role);

        if (!hasRole) {
            throw new ForbiddenException(`Access denied: requires one of [${requiredRoles.join(', ')}]`);
        }

        return true;
    }
}
