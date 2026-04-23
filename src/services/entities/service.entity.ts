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
import { ServiceCategory } from './service-category.entity';
import { ServiceInquiry } from './service-inquiry.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Service {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ unique: true })
    slug: string;

    @Column({ nullable: true, type: 'text' })
    description: string;

    @Column({ nullable: true, type: 'text' })
    content: string;

    @Column({ nullable: true })
    icon: string;

    @Column({ nullable: true })
    image: string;

    @Column({ type: 'jsonb', nullable: true })
    gallery: string[];

    // Category
    @Column({ nullable: true })
    categoryId: number;

    @ManyToOne(() => ServiceCategory, { nullable: true })
    @JoinColumn({ name: 'categoryId' })
    category: ServiceCategory;

    // Mission Section
    @Column({ nullable: true })
    missionTitle: string;

    @Column({ nullable: true })
    missionSubtitle: string;

    @Column({ nullable: true, type: 'text' })
    missionDescription: string;

    // Key Points (Directives)
    @Column({ type: 'jsonb', nullable: true })
    directives: { title: string; details: string }[];

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

    @Column({ default: 0 })
    order: number;

    // Analytics
    @Column({ default: 0 })
    views: number;

    @Column({ default: 0 })
    inquiryCount: number;

    // Relationships
    @OneToMany(() => ServiceInquiry, (inquiry) => inquiry.service)
    inquiries: ServiceInquiry[];

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