import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  name: string;

  @Column()
  email: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ nullable: true })
  @Index()
  articleId: number;

  @Column({ nullable: true })
  articleSlug: string;

  @Column({ nullable: true })
  articleTitle: string;

  @Column({ default: 'pending' })
  @Index()
  status: 'pending' | 'approved' | 'rejected';

  @Column({ nullable: true })
  replyText: string;

  @Column({ nullable: true })
  replyDate: Date;

  @Column({ default: 0 })
  likes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
