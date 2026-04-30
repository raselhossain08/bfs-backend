import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Event } from './event.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class EventRegistration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @ManyToOne(() => Event, (event) => event.registrations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  organization: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ default: 1 })
  numberOfAttendees: number;

  @Column({ default: 'registered' })
  status: string;

  @Column({ nullable: true })
  registeredBy: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'registeredBy' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
