import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne } from "typeorm";
import { Shot } from "./Shot";

@Entity("shot_environment")
export class ShotEnvironment {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @OneToOne(() => Shot, shot => shot.environment, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'shot_id' })
    shot!: Shot;

    @Column({ type: 'numeric', precision: 4, scale: 1, nullable: true })
    ambient_temp_c!: number | null;

    @Column({ type: 'numeric', precision: 4, scale: 1, nullable: true })
    humidity_percent!: number | null;

    @Column({ type: 'text', nullable: true })
    water_source?: string | null;

    @Column({ type: 'integer', nullable: true })
    estimated_water_hardness_ppm?: number | null;

    @Column({ type: 'integer', nullable: true })
    machine_warmup_minutes?: number | null;

    @Column({ type: 'integer', nullable: true })
    shots_since_clean?: number | null;
}