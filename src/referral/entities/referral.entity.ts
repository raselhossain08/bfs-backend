import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ReferralStatus {
    PENDING = 'pending',   // Invitation sent but not yet registered
    JOINED = 'joined',     // User registered with referral code
    DONATED = 'donated',   // User has made at least one donation
}

@Entity('referrals')
export class Referral {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @Index()
    referrerId: number; // User who shared the referral

    @Column({ nullable: true })
    referredUserId: number; // User who registered (null until they join)

    @Column()
    @Index()
    email: string; // Email of the invited user

    @Column({ unique: true })
    referralCode: string; // Unique code used to track this referral

    @Column({
        type: 'enum',
        enum: ReferralStatus,
        default: ReferralStatus.PENDING,
    })
    status: ReferralStatus;

    @Column({ nullable: true, type: 'timestamp' })
    joinedAt: Date; // When the referred user registered

    @Column({ default: 0, type: 'decimal', precision: 12, scale: 2 })
    totalDonated: number; // Total amount donated by referred user

    @Column({ default: 0 })
    donationCount: number; // Number of donations made by referred user

    @ManyToOne(() => User)
    @JoinColumn({ name: 'referrerId' })
    referrer: User;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'referredUserId' })
    referredUser: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}