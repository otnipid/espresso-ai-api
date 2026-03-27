import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Shot } from './Shot';

@Entity('shot_extraction')
export class ShotExtraction {
  @PrimaryColumn({ type: 'uuid' })
  shot_id!: string;

  @OneToOne(() => Shot, shot => shot.extraction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shot_id' })
  shot!: Shot;

  @Column({ type: 'numeric', precision: 4, scale: 1, nullable: true })
  water_temp_c?: number | null;

  @Column({ type: 'numeric', precision: 4, scale: 1, nullable: true })
  preinfusion_seconds?: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  shot_time_seconds?: number | null;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  yield_grams?: number | null;

  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true })
  peak_pressure_bar?: number | null;

  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true })
  avg_pressure_bar?: number | null;
}
