import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('subscribers')
export class Subscriber {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    @Index()
    email: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true })
    source: string;

    @CreateDateColumn()
    subscribedAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    unsubscribedAt: Date;
}
