import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Shot } from './Shot';

@Entity('shot_extraction')
export class ShotExtraction {
  @PrimaryColumn({ type: 'uuid' })
  shot_id!: string;

  @OneToOne(() => Shot, shot => shot.extraction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shot_id' })
  shot!: Shot;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  dose_grams?: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  yield_grams?: number | null;

  @Column({ type: 'integer', nullable: true })
  extraction_time_seconds?: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  temperature_celsius?: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  pressure_bars?: number | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;
}
