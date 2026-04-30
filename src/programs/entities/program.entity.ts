import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Program {
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

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  categoryId: number;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true, type: 'int' })
  beneficiaries: number;

  @Column({ nullable: true })
  impact: string;

  @Column({ nullable: true })
  metric: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  goal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  raised: number;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  milestones: { title: string; date: string; status: string }[];

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  videoType: string;

  @Column({ type: 'jsonb', nullable: true })
  contentBlocks: any[];

  @Column({ nullable: true })
  metaTitle: string;

  @Column({ nullable: true, type: 'text' })
  metaDescription: string;

  @Column({ type: 'jsonb', nullable: true })
  metaKeywords: string[];

  @Column({ default: 'active' })
  status: string;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: 0 })
  order: number;

  @Column({ default: 0 })
  views: number;

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
