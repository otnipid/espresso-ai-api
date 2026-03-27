import { Entity, PrimaryColumn, Column, JoinColumn, OneToOne } from 'typeorm';
import { Shot } from './Shot';

@Entity('shot_feedback')
export class ShotFeedback {
  @PrimaryColumn({ type: 'uuid' })
  shot_id!: string;

  @OneToOne(() => Shot, shot => shot.feedback, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shot_id' })
  shot!: Shot;

  @Column({ type: 'integer', nullable: true })
  overall_score?: number | null;

  @Column({ type: 'integer', nullable: true })
  acidity?: number | null;

  @Column({ type: 'integer', nullable: true })
  sweetness?: number | null;

  @Column({ type: 'integer', nullable: true })
  bitterness?: number | null;

  @Column({ type: 'integer', nullable: true })
  body?: number | null;

  @Column({ type: 'text', nullable: true })
  extraction_assessment?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;
}
