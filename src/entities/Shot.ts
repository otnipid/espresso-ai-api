import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { BeanBatch } from "./BeanBatch";
import { Machine } from "./Machine";
import { ShotPreparation } from "./ShotPreparation";
import { ShotExtraction } from "./ShotExtraction";

type ShotType = 'ristretto' | 'normale' | 'lungo';

@Entity("shots")
export class Shot {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => BeanBatch, beanBatch => beanBatch.shots)
    @JoinColumn({ name: 'bean_batch_id' })
    beanBatch!: BeanBatch;

    @ManyToOne(() => Machine, machine => machine.shots)
    @JoinColumn({ name: 'machine_id' })
    machine!: Machine;

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