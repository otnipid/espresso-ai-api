import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { Shot } from "./Shot";

@Entity("shot_preparation")
export class ShotPreparation {
    @PrimaryColumn({ type: 'uuid' })
    shot_id!: string;

    @OneToOne(() => Shot, shot => shot.preparation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'shot_id' })
    shot!: Shot;

    @Column({ type: 'integer', nullable: true })
    grind_setting?: number | null;

    @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
    dose_grams?: number | null;

    @Column({ type: 'text', nullable: true })
    basket_type?: string | null;

    @Column({ type: 'integer', nullable: true })
    basket_size_grams?: number | null;

    @Column({ type: 'text', nullable: true })
    distribution_method?: string | null;

    @Column({ type: 'text', nullable: true })
    tamp_type?: string | null;

    @Column({ type: 'text', nullable: true })
    tamp_pressure_category?: string | null;
}