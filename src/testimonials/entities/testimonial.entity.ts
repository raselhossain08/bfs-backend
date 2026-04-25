import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TestimonialStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

@Entity()
export class Testimonial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  role: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'text' })
  quote: string;

  @Column({ type: 'int', default: 5 })
  rating: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  donationAmount: number;

  @Column({ nullable: true })
  campaign: string;

  @Column({ default: 0 })
  order: number;

  @Column({
    type: 'enum',
    enum: TestimonialStatus,
    default: TestimonialStatus.ACTIVE,
  })
  status: TestimonialStatus;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
