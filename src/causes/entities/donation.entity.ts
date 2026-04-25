import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Cause } from './cause.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
@Index(['causeId', 'status'])
@Index(['donorId', 'createdAt'])
@Index(['createdAt'])
export class Donation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  transactionId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ nullable: true })
  causeId: number;

  @ManyToOne(() => Cause, { nullable: true })
  @JoinColumn({ name: 'causeId' })
  cause: Cause;

  @Column({ nullable: true })
  causeName: string;

  @Column({ default: 'completed' })
  status: string;

  @Column({ default: 'Stripe' })
  paymentMethod: string;

  // Donor Info
  @Column({ nullable: true })
  donorId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'donorId' })
  donor: User;

  @Column()
  name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, type: 'text' })
  motivation: string;

  // Anonymous donation
  @Column({ default: false })
  isAnonymous: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
