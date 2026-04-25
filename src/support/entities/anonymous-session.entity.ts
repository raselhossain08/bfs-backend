import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('anonymous_chat_sessions')
export class AnonymousSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  sessionId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ default: false })
  isEscalated: boolean;

  @Column({ nullable: true })
  assignedTo: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
