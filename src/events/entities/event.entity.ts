import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { EventType } from './event-type.entity';
import { EventRegistration } from './event-registration.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  shortDescription: string;

  @Column({ nullable: true, type: 'text' })
  content: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ nullable: true, type: 'timestamp' })
  endDate: Date;

  @Column({ nullable: true })
  location: string;

  @Column({ default: 'physical' })
  locationType: string;

  @Column({ nullable: true })
  virtualUrl: string;

  @Column({ nullable: true })
  image: string;

  @Column({ type: 'jsonb', nullable: true })
  gallery: string[];

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  videoType: string;

  @Column({ nullable: true })
  eventTypeId: number;

  @ManyToOne(() => EventType, { nullable: true })
  @JoinColumn({ name: 'eventTypeId' })
  eventType: EventType;

  @Column({ nullable: true })
  eventTypeName: string;

  @Column({ default: 'Upcoming' })
  status: string;

  @Column({ nullable: true })
  maxAttendees: number;

  @Column({ default: 0 })
  currentAttendees: number;

  @Column({ nullable: true, type: 'timestamp' })
  registrationDeadline: Date;

  @Column({ default: false })
  requiresRegistration: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true })
  organizerName: string;

  @Column({ nullable: true })
  organizerEmail: string;

  @Column({ nullable: true })
  organizerPhone: string;

  @Column({ type: 'jsonb', nullable: true })
  contentBlocks: any[];

  @Column({ nullable: true })
  metaTitle: string;

  @Column({ nullable: true, type: 'text' })
  metaDescription: string;

  @Column({ type: 'jsonb', nullable: true })
  metaKeywords: string[];

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  likes: number;

  @OneToMany(() => EventRegistration, (reg) => reg.event)
  registrations: EventRegistration[];

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
