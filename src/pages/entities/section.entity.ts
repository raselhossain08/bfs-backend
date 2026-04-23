import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Page } from './page.entity';

@Entity()
export class Section {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    pageId: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    key: string;

    @Column({ nullable: true, type: 'text' })
    description: string;

    @Column({ nullable: true, type: 'jsonb' })
    content: any;

    @Column({ nullable: true })
    cmsEndpoint: string;

    @Column({ default: 'published' })
    status: string; // 'published' | 'draft'

    @Column({ default: 0 })
    order: number;

    @ManyToOne(() => Page, (page) => page.sections, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pageId' })
    page: Page;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}