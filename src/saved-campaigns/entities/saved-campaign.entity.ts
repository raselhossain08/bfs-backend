import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Cause } from '../../causes/entities/cause.entity';

@Entity()
@Index(['userId', 'causeId'])
@Unique(['userId', 'causeId'])
export class SavedCampaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  causeId: number;

  @ManyToOne(() => Cause)
  @JoinColumn({ name: 'causeId' })
  cause: Cause;

  @Column({ default: false })
  notifyOnGoal: boolean;

  @Column({ default: false })
  notifyOnUpdate: boolean;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ nullable: true })
  folder: string;

  @CreateDateColumn()
  savedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
