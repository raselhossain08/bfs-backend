import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Service } from './service.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class ServiceInquiry {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    serviceId: number;

    @ManyToOne(() => Service, (service) => service.inquiries)
    @JoinColumn({ name: 'serviceId' })
    service: Service;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    organization: string;

    @Column({ nullable: true, type: 'text' })
    message: string;

    @Column({ default: 'pending' })
    status: string;

    @Column({ nullable: true, type: 'text' })
    notes: string;

    @Column({ nullable: true })
    assignedTo: number;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assignedTo' })
    assignee: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}