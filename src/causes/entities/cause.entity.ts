import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { CauseCategory } from './cause-category.entity';
import { Donation } from './donation.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Cause {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ unique: true })
    slug: string;

    @Column({ nullable: true, type: 'text' })
    shortDescription: string;

    @Column({ nullable: true, type: 'text' })
    description: string;

    @Column({ nullable: true, type: 'text' })
    content: string;

    @Column({ nullable: true })
    image: string;

    @Column({ type: 'jsonb', nullable: true })
    gallery: string[];

    @Column({ type: 'jsonb', nullable: true })
    videos: { url: string; type: string; caption?: string }[];

    // Category
    @Column({ nullable: true })
    categoryId: number;

    @ManyToOne(() => CauseCategory, { nullable: true })
    @JoinColumn({ name: 'categoryId' })
    category: CauseCategory;

    // Tag/Badge
    @Column({ nullable: true })
    tag: string;

    @Column({ nullable: true })
    tagColor: string;

    // Funding - Core Fields
    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    goal: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    raised: number;

    @Column({ default: 0 })
    donors: number;

    @Column({ default: 0 })
    progress: number;

    // Location & Impact
    @Column({ nullable: true })
    location: string;

    @Column({ nullable: true, type: 'text' })
    impact: string;

    @Column({ nullable: true })
    metric: string;

    // Display Settings
    @Column({ nullable: true })
    gradient: string;

    @Column({ nullable: true })
    size: string;

    @Column({ nullable: true })
    glow: string;

    // Video
    @Column({ nullable: true })
    videoUrl: string;

    @Column({ nullable: true })
    videoType: string;

    // Content Blocks
    @Column({ type: 'jsonb', nullable: true })
    contentBlocks: any[];

    // SEO
    @Column({ nullable: true })
    metaTitle: string;

    @Column({ nullable: true, type: 'text' })
    metaDescription: string;

    @Column({ nullable: true })
    metaKeywords: string;

    // Status & Featured & Ordering
    @Column({ default: 'active' })
    status: string;

    @Column({ default: false })
    isFeatured: boolean;

    @Column({ default: false })
    isUrgent: boolean;

    @Column({ default: 0 })
    order: number;

    @Column({ nullable: true })
    endDate: Date;

    @Column({ nullable: true })
    beneficiaries: number;

    @Column({ default: 'USD' })
    currency: string;

    // Analytics
    @Column({ default: 0 })
    views: number;

    // Relationships
    @OneToMany(() => Donation, (donation) => donation.cause)
    donations: Donation[];

    // Audit
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    createdBy: number;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdBy' })
    creator: User;
}