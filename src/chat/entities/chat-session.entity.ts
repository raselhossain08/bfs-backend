import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SessionStatus {
    ACTIVE = 'active',
    WAITING = 'waiting',
    RESOLVED = 'resolved',
    CLOSED = 'closed'
}

@Entity('live_chat_sessions')
export class ChatSession {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    userId: number;

    @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.ACTIVE })
    status: SessionStatus;

    @Column({ default: true })
    isBotActive: boolean;

    @Column({ nullable: true })
    assignedAgentId: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    sessionToken: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: {
        browserInfo?: string;
        pageUrl?: string;
        userAgent?: string;
        ipAddress?: string;
    };

    @Column({ type: 'timestamp', nullable: true })
    lastActivityAt: Date;

    @CreateDateColumn()
    startedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    endedAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assignedAgentId' })
    assignedAgent: User;
}