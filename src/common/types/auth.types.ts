import { Request } from 'express';
import { UserRole } from '../../admin/admin.dto';

// Authenticated user from JWT token
export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole | string;
  status: string;
  avatar?: string;
  phone?: string;
}

// Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

// Safe user response (without sensitive fields)
export interface SafeUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  avatar?: string;
  phone?: string;
  lastActive?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  bio?: string;
  timezone?: string;
  language?: string;
  address?: string;
  city?: string;
  country?: string;
  notificationPreferences?: {
    emailReceipts?: boolean;
    emailUpdates?: boolean;
    emailMarketing?: boolean;
    smsAlerts?: boolean;
    loginAlerts?: boolean;
    securityAlerts?: boolean;
  };
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  referralCode?: string;
  referredBy?: number;
}
