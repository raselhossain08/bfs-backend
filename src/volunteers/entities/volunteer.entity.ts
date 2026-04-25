import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type ContentBlockType =
  | 'shared.rich-text'
  | 'shared.quote'
  | 'shared.media';

export class ContentBlock {
  __component: ContentBlockType;
  body?: string;
  author?: string;
  file?: { url: string };
  caption?: string;
}

export class FundingPhase {
  title: string;
  details: string;
}

export class SocialLinks {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
}

export class SeoMetadata {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

@Entity()
export class Volunteer {
  @PrimaryGeneratedColumn()
  id: number;

  // Basic Information
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  slug: string;

  // Role and Status
  @Column({ nullable: true })
  role: string;

  @Column({ nullable: true })
  title: string;

  @Column({ default: 'active' })
  status: string; // active, inactive

  // Profile Content
  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ nullable: true, type: 'text' })
  impact: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true, type: 'text' })
  skills: string; // Stored as JSON string or comma-separated

  @Column({ type: 'simple-array', nullable: true })
  languages: string[];

  // Experience
  @Column({ nullable: true })
  experienceTitle: string;

  @Column({ nullable: true })
  experienceSubtitle: string;

  @Column({ nullable: true, type: 'text' })
  experienceDescription: string;

  // Programs/Funding Phases (stored as JSON)
  @Column({ type: 'jsonb', nullable: true })
  fundingPhases: FundingPhase[];

  // Content Blocks (stored as JSON)
  @Column({ type: 'jsonb', nullable: true })
  blocks: ContentBlock[];

  // Social Links
  @Column({ type: 'jsonb', nullable: true })
  socialLinks: SocialLinks;

  // SEO Metadata
  @Column({ type: 'jsonb', nullable: true })
  seo: SeoMetadata;

  // Link to Application
  @Column({ nullable: true })
  applicationId: number;

  // Display Order
  @Column({ default: 0 })
  order: number;

  // Audit Fields
  @Column({ nullable: true })
  createdBy: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column({ nullable: true })
  updatedBy: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updater: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
