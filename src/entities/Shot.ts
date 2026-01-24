import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { User } from "./User";
import { BeanBatch } from "./BeanBatch";
import { Machine } from "./Machine";
import { Grinder } from "./Grinder";
import { ShotPreparation } from "./ShotPreparation";
import { ShotExtraction } from "./ShotExtraction";

type ShotType = 'ristretto' | 'normale' | 'lungo';

@Entity("shots")
export class Shot {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User, user => user.shots)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => BeanBatch, beanBatch => beanBatch.shots)
    @JoinColumn({ name: 'bean_batch_id' })
    beanBatch!: BeanBatch;

    @ManyToOne(() => Machine, machine => machine.shots)
    @JoinColumn({ name: 'machine_id' })
    machine!: Machine;

    @ManyToOne(() => Grinder, grinder => grinder.shots)
    @JoinColumn({ name: 'grinder_id' })
    grinder!: Grinder;

    @Column({ type: 'text' })
    shot_type!: ShotType;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    pulled_at!: Date;

    @Column({ type: 'boolean', nullable: true })
    success?: boolean | null;

    @Column({ type: 'text', nullable: true })
    notes?: string | null;

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;

    @OneToOne(() => ShotPreparation, preparation => preparation.shot)
    preparation?: ShotPreparation;

    @OneToOne(() => ShotExtraction, extraction => extraction.shot)
    extraction?: ShotExtraction;
}