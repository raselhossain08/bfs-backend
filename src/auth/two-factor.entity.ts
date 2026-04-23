import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Entity()
export class TwoFactorAuth {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({ default: false })
    isEnabled: boolean;

    @Column({ nullable: true })
    secret: string;

    @Column({ nullable: true })
    backupCodes: string; // JSON string of encrypted backup codes

    @Column({ type: 'timestamp', nullable: true })
    verifiedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}