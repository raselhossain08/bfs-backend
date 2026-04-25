import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Article } from '../../articles/entities/article.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  color: string;

  @Column({ default: '#0d9488' })
  iconColor: string;

  @Column({ default: 0 })
  order: number;

  @Column({ default: 'active' })
  status: string; // active, inactive

  // Hierarchical support
  @Column({ nullable: true })
  parentId: number;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  // Articles relationship
  @OneToMany(() => Article, (article) => article.category)
  articles: Article[];

  // SEO metadata
  @Column({ nullable: true })
  metaTitle: string;

  @Column({ nullable: true, type: 'text' })
  metaDescription: string;

  @Column({ nullable: true, type: 'simple-array' })
  keywords: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
