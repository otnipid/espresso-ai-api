import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm"
import { BeanBatch } from "./BeanBatch"

@Entity()
export class Bean {
    @PrimaryGeneratedColumn("uuid")
    id!: string

    @Column({ type: 'varchar' })
    name!: string

    @Column({ type: 'varchar' })
    roaster!: string

    @Column({ type: 'varchar', nullable: true })
    country?: string | null;

    @Column({ type: 'varchar', nullable: true })
    region?: string | null;

    @Column({ type: 'varchar', nullable: true })
    farm?: string | null;

    @Column({ type: 'varchar', nullable: true })
    varietal?: string | null;

    @Column({ type: 'varchar', nullable: true })
    processing_method?: string | null;

    @Column({ type: 'integer', nullable: true })
    altitude_m?: number | null;

    @Column({ type: 'varchar', nullable: true })
    density_category?: string | null;

    @CreateDateColumn()
    created_at!: Date;

    @OneToMany(() => BeanBatch, beanBatch => beanBatch.bean)
    beanBatches!: BeanBatch[];
}