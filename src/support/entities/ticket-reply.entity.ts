import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('ticket_replies')
export class TicketReply {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    ticketId: number;

    @Column({ type: 'text' })
    message: string;

    @Column({
        type: 'enum',
        enum: ['admin', 'user'],
        default: 'admin'
    })
    sender: 'admin' | 'user';

    @Column({ nullable: true })
    adminId: number;

    @Column({ nullable: true })
    userId: number;

    @ManyToOne(() => User, user => user.id, { nullable: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => User, user => user.id, { nullable: true })
    @JoinColumn({ name: 'adminId' })
    admin: User;

    @CreateDateColumn()
    createdAt: Date;
}