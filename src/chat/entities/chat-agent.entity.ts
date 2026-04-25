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

export enum AgentStatus {
  ONLINE = 'online',
  BUSY = 'busy',
  AWAY = 'away',
  OFFLINE = 'offline',
}

@Entity('live_chat_agents')
export class ChatAgent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'enum', enum: AgentStatus, default: AgentStatus.OFFLINE })
  status: AgentStatus;

  @Column({ default: 0 })
  activeChats: number;

  @Column({ default: 5 })
  maxChats: number;

  @Column({ type: 'jsonb', nullable: true })
  specialties: string[];

  @Column({ type: 'timestamp', nullable: true })
  lastOnlineAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
