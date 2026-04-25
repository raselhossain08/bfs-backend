import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('site_settings')
export class SiteSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ nullable: true })
  group: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}