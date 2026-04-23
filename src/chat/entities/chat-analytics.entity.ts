import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ChatSession } from './chat-session.entity';

@Entity('live_chat_analytics')
export class ChatAnalytics {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    sessionId: number;

    @Column({ default: 0 })
    messageCount: number;

    @Column({ default: 0 })
    userMessageCount: number;

    @Column({ default: 0 })
    botMessageCount: number;

    @Column({ default: 0 })
    agentMessageCount: number;

    @Column({ type: 'integer', nullable: true })
    responseTimeMs: number;

    @Column({ type: 'integer', nullable: true })
    resolutionTimeMs: number;

    @Column({ type: 'integer', nullable: true })
    satisfactionRating: number;

    @Column({ type: 'text', nullable: true })
    feedbackText: string;

    @Column({ default: false })
    wasEscalated: boolean;

    @CreateDateColumn()
    createdAt: Date;

    // Relations
    @ManyToOne(() => ChatSession)
    @JoinColumn({ name: 'sessionId' })
    session: ChatSession;
}