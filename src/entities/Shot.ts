import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  DeleteDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BeanBatch } from './BeanBatch';
import { Machine } from './Machine';
import { User } from './User';
import { Grinder } from './Grinder';
import { ShotPreparation } from './ShotPreparation';
import { ShotExtraction } from './ShotExtraction';
import { ShotEnvironment } from './shotEnvironment';
import { ShotFeedback } from './shotFeedback';

type ShotType = 'ristretto' | 'normale' | 'lungo';

@Entity('shots')
export class Shot {
  @PrimaryGeneratedColumn('uuid')
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

  @Column({ name: 'shot_type', type: 'text' })
  shot_type!: ShotType;

  @Column({ name: 'pulled_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  pulled_at!: Date;

  @Column({ type: 'boolean', nullable: true })
  success?: boolean | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deleted_at?: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy?: User | null;

  @Column({ name: 'version', type: 'integer', default: 1 })
  version!: number;

  @OneToOne(() => ShotPreparation, preparation => preparation.shot)
  preparation?: ShotPreparation;

  @OneToOne(() => ShotExtraction, extraction => extraction.shot)
  extraction?: ShotExtraction;

  @OneToOne(() => ShotEnvironment, environment => environment.shot)
  environment?: ShotEnvironment;

  @OneToOne(() => ShotFeedback, feedback => feedback.shot)
  feedback?: ShotFeedback;
}
