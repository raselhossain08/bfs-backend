import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity()
export class Article {
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
    image: string;

    @Column({ nullable: true })
    author: string;

    @Column({ nullable: true })
    authorImage: string;

    @Column({ nullable: true })
    authorBio: string;

    // Category relationship - foreign key
    @Column({ nullable: true })
    categoryId: number;

    @ManyToOne(() => Category, { nullable: true })
    @JoinColumn({ name: 'categoryId' })
    category: Category;

    // Legacy category name field (for migration purposes)
    @Column({ nullable: true })
    categoryName: string;

    @Column({ default: 0 })
    views: number;

    @Column({ default: 0 })
    likes: number;

    @Column({ default: 'draft' })
    status: string; // draft, published, archived

    @Column({ nullable: true, type: 'text' })
    tags: string; // JSON array of tags

    @Column({ nullable: true })
    featured: boolean;

    // SEO fields
    @Column({ nullable: true })
    metaTitle: string;

    @Column({ nullable: true, type: 'text' })
    metaDescription: string;

    @Column({ nullable: true, type: 'simple-array' })
    keywords: string[];

    @Column({ nullable: true })
    publishedAt: Date;

    // Content blocks for rich content editing
    @Column({ nullable: true, type: 'text' })
    contentBlocks: string; // JSON stringified array of ContentBlock

    // Video support
    @Column({ nullable: true })
    videoUrl: string;

    // Gallery images
    @Column({ nullable: true, type: 'text' })
    images: string; // JSON stringified array of image URLs

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}