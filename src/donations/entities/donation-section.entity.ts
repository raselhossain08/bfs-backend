import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('donation_sections')
export class DonationSection {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ nullable: true })
    subtitle: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    badgeText: string;

    @Column({ nullable: true })
    heroImage: string;

    @Column({ default: '#14b8a6' })
    primaryColor: string;

    @Column({ type: 'simple-json', nullable: true })
    impactStats: {
        id: string;
        label: string;
        value: string;
    }[];

    @Column({ type: 'simple-json', nullable: true })
    impactItems: {
        id: string;
        amount: string;
        label: string;
        icon: string;
    }[];

    @Column({ type: 'simple-json', nullable: true })
    amountPresets: {
        value: number;
        isDefault?: boolean;
    }[];

    @Column({ default: 0 })
    donorCount: number;

    @Column({ default: true })
    enableRecurring: boolean;

    @Column({ default: true })
    enableCustomAmount: boolean;

    @Column({ default: 1 })
    minAmount: number;

    @Column({ default: 10000 })
    maxAmount: number;

    @Column({ type: 'simple-json', nullable: true })
    securityBadges: {
        id: string;
        icon: string;
        text: string;
        enabled: boolean;
    }[];

    @Column({ type: 'text', nullable: true })
    thankYouMessage: string;

    @Column({ default: true })
    receiptEnabled: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
