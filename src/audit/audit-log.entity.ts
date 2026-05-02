import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity';

export enum AuditAction {
  // User actions
  USER_CREATE = 'user_create',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',
  USER_ROLE_CHANGE = 'user_role_change',
  USER_STATUS_CHANGE = 'user_status_change',
  USER_PASSWORD_RESET = 'user_password_reset',
  USER_EXPORT = 'user_export',

  // Auth actions
  AUTH_LOGIN = 'auth_login',
  AUTH_LOGOUT = 'auth_logout',
  AUTH_LOGIN_FAILED = 'auth_login_failed',
  AUTH_2FA_ENABLED = 'auth_2fa_enabled',
  AUTH_2FA_DISABLED = 'auth_2fa_disabled',

  // Session actions
  SESSION_CREATE = 'session_create',
  SESSION_REVOKE = 'session_revoke',

  // Bulk actions
  BULK_STATUS_CHANGE = 'bulk_status_change',
  BULK_ROLE_CHANGE = 'bulk_role_change',
  BULK_DELETE = 'bulk_delete',
}

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string;

  @Column()
  entityType: string;

  @Column()
  entityId: number;

  @Column({ nullable: true })
  actorId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
