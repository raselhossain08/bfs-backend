import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Cause } from '../../causes/entities/cause.entity';
import { PaymentMethod } from '../../payment-methods/entities/payment-method.entity';

@Entity('recurring_donations')
export class RecurringDonation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  causeId: number;

  @ManyToOne(() => Cause, { nullable: true })
  @JoinColumn({ name: 'causeId' })
  cause: Cause;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly',
  })
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';

  @Column({ nullable: true })
  paymentMethodId: number;

  @ManyToOne(() => PaymentMethod, { nullable: true })
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({
    type: 'enum',
    enum: ['active', 'paused', 'cancelled'],
    default: 'active',
  })
  status: 'active' | 'paused' | 'cancelled';

  @Column({ type: 'timestamp', nullable: true })
  nextDonationDate: Date;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDonated: number;

  @Column({ default: 0 })
  donationCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
