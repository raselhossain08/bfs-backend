import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Section } from './section.entity';

@Entity()
export class Page {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: 'static' })
  type: string; // 'static' | 'dynamic'

  @Column({ nullable: true })
  icon: string; // Lucide icon name

  @Column({ default: 'published' })
  status: string; // 'published' | 'draft'

  @Column({ default: 0 })
  order: number;

  @Column({ nullable: true })
  metaTitle: string;

  @Column({ nullable: true, type: 'text' })
  metaDescription: string;

  @Column({ type: 'jsonb', nullable: true })
  metaKeywords: string[];

  @OneToMany(() => Section, (section) => section.page, { cascade: true })
  sections: Section[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
