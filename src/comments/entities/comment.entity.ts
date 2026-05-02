import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
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

  // For threaded comments
  @Column({ nullable: true })
  @Index()
  parentId: number;

  @ManyToOne(() => Comment, (comment) => comment.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Comment;

  @OneToMany(() => Comment, (comment) => comment.parent)
  children: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
