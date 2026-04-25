import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum MessageSender {
  USER = 'user',
  SUPPORT = 'support',
  BOT = 'bot',
  SYSTEM = 'system',
}

export enum MessageSource {
  AUTHENTICATED = 'authenticated',
  ANONYMOUS = 'anonymous',
}

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  @Index()
  sessionId: string;

  @Column({
    type: 'enum',
    enum: MessageSource,
    default: MessageSource.AUTHENTICATED,
  })
  source: MessageSource;

  @Column({
    type: 'enum',
    enum: MessageSender,
    default: MessageSender.USER,
  })
  sender: MessageSender;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isEscalated: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
