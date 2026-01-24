import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToMany } from "typeorm";
import { Bean } from "./Bean";
import { Shot } from "./Shot";

@Entity("bean_batches")
export class BeanBatch {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Bean, bean => bean.beanBatches)
    bean!: Bean;

    @Column({ type: 'date' })
    roastDate!: Date;

    @Column({ type: 'date', nullable: true })
    bestByDate?: Date | null;

    @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
    weightKg?: number | null;

    @Column({ type: 'text', nullable: true })
    notes?: string | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @OneToMany(() => Shot, shot => shot.beanBatch)
    shots!: Shot[];
}