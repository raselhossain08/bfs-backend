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

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ name: 'stripePaymentMethodId' })
  stripePaymentMethodId: string; // Stripe PM ID (pm_xxx)

  @Column({ name: 'stripeCustomerId', nullable: true })
  stripeCustomerId: string; // Stripe Customer ID (cus_xxx)

  @Column({ default: 'card' })
  type: string; // card, us_bank_account, etc.

  @Column()
  brand: string; // visa, mastercard, amex, etc.

  @Column({ length: 4 })
  last4: string; // Last 4 digits only

  @Column()
  expMonth: number;

  @Column()
  expYear: number;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ nullable: true, type: 'text' })
  cardholderName: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
