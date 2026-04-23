import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('alert_broadcasts')
export class AlertBroadcast {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'simple-json' })
    audience: string[];

    @Column({ default: 0 })
    recipientCount: number;

    @Column({ default: 0 })
    sentCount: number;

    @Column({ default: 0 })
    failedCount: number;

    @Column({ nullable: true })
    @Index()
    sentAt: Date;

    @Column({ nullable: true })
    sentBy: string;

    @Column({ default: false })
    smsEnabled: boolean;

    @Column({ type: 'simple-json', nullable: true })
    recipients: any[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
