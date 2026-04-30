import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Donation } from '../../causes/entities/donation.entity';
import { PaymentMethod } from '../../payment-methods/entities/payment-method.entity';
import { RecurringDonation } from '../../recurring-donations/entities/recurring-donation.entity';
import { Goal } from '../../goals/entities/goal.entity';
import { SavedCampaign } from '../../saved-campaigns/entities/saved-campaign.entity';
import { Referral } from '../../referral/entities/referral.entity';
import { AuditLog } from '../../audit/audit-log.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password?: string; // Nullable for OAuth later, but required for local

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ default: 'user' }) // 'super_admin', 'admin', 'editor', 'manager', 'user'
  role: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: 'active' }) // 'active', 'inactive', 'suspended'
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  lastActive: Date;

  @Column({ nullable: true })
  resetToken: string;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiry: Date;

  @Column({ nullable: true, select: false })
  refreshToken: string;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ unique: true, nullable: true })
  referralCode: string; // Unique code for sharing referrals

  @Column({ nullable: true })
  referredBy: number; // FK to user who referred this user

  // Profile fields
  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  // Notification preferences
  @Column({ type: 'jsonb', nullable: true })
  notificationPreferences: {
    emailReceipts?: boolean;
    emailUpdates?: boolean;
    emailMarketing?: boolean;
    smsAlerts?: boolean;
    loginAlerts?: boolean;
    securityAlerts?: boolean;
  };

  // Verification status
  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: false })
  phoneVerified: boolean;

  // 2FA
  @Column({ default: false })
  twoFactorEnabled: boolean;

  @Column({ nullable: true, select: false })
  twoFactorSecret: string;

  @Column({ type: 'jsonb', nullable: true, select: false })
  twoFactorBackupCodes: string[];

  // OTP Login
  @Column({ nullable: true, select: false })
  otpLoginCode: string;

  @Column({ type: 'timestamp', nullable: true, select: false })
  otpLoginExpiry: Date;

  @Column({ default: 0 })
  otpAttempts: number;

  @Column({ nullable: true, type: 'timestamp', select: false })
  otpAttemptsResetAt: Date;

  @Column({ default: true })
  allowOtpLogin: boolean;

  // Password attempt lockout
  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date;

  // Relationships
  @OneToMany(() => Donation, (donation) => donation.donor, { cascade: true })
  donations: Donation[];

  @OneToMany(() => PaymentMethod, (paymentMethod) => paymentMethod.user, {
    cascade: true,
  })
  paymentMethods: PaymentMethod[];

  @OneToMany(
    () => RecurringDonation,
    (recurringDonation) => recurringDonation.user,
    { cascade: true },
  )
  recurringDonations: RecurringDonation[];

  @OneToMany(() => Goal, (goal) => goal.user, { cascade: true })
  goals: Goal[];

  @OneToMany(() => SavedCampaign, (savedCampaign) => savedCampaign.user, {
    cascade: true,
  })
  savedCampaigns: SavedCampaign[];

  @OneToMany(() => Referral, (referral) => referral.referrer, { cascade: true })
  referralsSent: Referral[];

  @OneToMany(() => Referral, (referral) => referral.referredUser, {
    cascade: true,
  })
  referralsReceived: Referral[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.actor, { cascade: true })
  auditLogs: AuditLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
