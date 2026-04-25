import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChatSession } from './chat-session.entity';

export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
  AGENT = 'agent',
  SYSTEM = 'system',
}

@Entity('live_chat_messages')
export class ChatMessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sessionId: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ type: 'enum', enum: MessageSender, default: MessageSender.USER })
  sender: MessageSender;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    attachments?: Array<{ name: string; url: string; type: string }>;
    reactions?: Array<{ type: string; userId: number }>;
  };

  @Column({ nullable: true })
  replyToId: number;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => ChatSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: ChatSession;
}
