import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('success_stories')
export class SuccessStory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    @Index()
    title: string;

    @Column({ unique: true, nullable: true })
    @Index()
    slug: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    category: string;

    @Column({ nullable: true })
    color: string;

    @Column({ nullable: true })
    region: string;

    @Column({ type: 'text', nullable: true })
    story: string;

    @Column({ type: 'text', nullable: true })
    fullStory: string;

    @Column({ nullable: true })
    impact: string;

    @Column({ nullable: true })
    year: string;

    @Column({ nullable: true })
    image: string;

    @Column({ nullable: true })
    videoUrl: string;

    @Column({ nullable: true })
    videoType: string;

    @Column({ type: 'simple-json', nullable: true })
    contentBlocks: any[];

    @Column({ default: 0 })
    @Index()
    order: number;

    @Column({ default: 'draft' })
    @Index()
    status: 'published' | 'draft';

    @Column({ default: 0 })
    views: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
