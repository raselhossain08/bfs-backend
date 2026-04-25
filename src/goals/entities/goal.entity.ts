import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Cause } from '../../causes/entities/cause.entity';

export type GoalType = 'monthly' | 'yearly' | 'campaign' | 'lifetime';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Index()
  @Column({ type: 'enum', enum: ['monthly', 'yearly', 'campaign', 'lifetime'] })
  type: GoalType;

  @Column()
  title: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  target: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  current: number;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string;

  @Column({ type: 'text', nullable: true })
  reward: string;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ type: 'int', nullable: true })
  causeId: number;

  @ManyToOne(() => Cause, { nullable: true })
  @JoinColumn({ name: 'causeId' })
  cause: Cause;

  @ManyToOne(() => User, (user) => user.goals)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
