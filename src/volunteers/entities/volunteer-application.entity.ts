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

export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ExperienceLevel {
  NONE = 'none',
  LESS_THAN_1 = 'less-than-1',
  ONE_TO_THREE = '1-3',
  THREE_TO_FIVE = '3-5',
  FIVE_TO_TEN = '5-10',
  TEN_PLUS = '10+',
}

export enum PreferredContact {
  EMAIL = 'email',
  PHONE = 'phone',
  WHATSAPP = 'whatsapp',
}

@Entity()
export class VolunteerApplication {
  @PrimaryGeneratedColumn()
  id: number;

  // Personal Information
  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  location: string;

  // Volunteering Interests
  @Column({ nullable: true })
  causeId: number;

  @Column({ nullable: true })
  causeTitle: string;

  @Column()
  interest: string;

  @Column({ nullable: true, type: 'text' })
  skills: string;

  @Column({ nullable: true })
  experience: string;

  // Availability
  @Column({ type: 'simple-array', nullable: true })
  availability: string[];

  @Column({ default: PreferredContact.EMAIL })
  preferredContact: string;

  // Languages
  @Column({ type: 'simple-array', nullable: true })
  languages: string[];

  // Previous Experience
  @Column({ default: false })
  hasVolunteeredBefore: boolean;

  @Column({ nullable: true, type: 'text' })
  previousVolunteerDetails: string;

  // Emergency Contact
  @Column({ nullable: true })
  emergencyContactName: string;

  @Column({ nullable: true })
  emergencyContactPhone: string;

  // Additional
  @Column({ nullable: true, type: 'text' })
  message: string;

  // Status & Review
  @Column({ default: ApplicationStatus.PENDING })
  status: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ nullable: true })
  reviewedBy: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: User;

  @Column({ nullable: true, type: 'timestamp' })
  reviewedAt: Date;

  // Created Volunteer Profile
  @Column({ nullable: true })
  volunteerProfileId: number;

  @CreateDateColumn()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
