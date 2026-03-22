import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Bean } from './Bean';
import { Shot } from './Shot';

@Entity('bean_batches')
export class BeanBatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Bean, bean => bean.beanBatches)
  @JoinColumn({ name: 'bean_id' })
  bean!: Bean;

  @Column({ name: 'roast_date', type: 'date' })
  roastDate!: Date;

  @Column({ name: 'bag_open_date', type: 'date', nullable: true })
  bagOpenDate?: Date | null;

  @Column({ name: 'roast_level', type: 'text', nullable: true })
  roastLevel?: string | null;

  @Column({ name: 'roast_degree', type: 'integer', nullable: true })
  roastDegree?: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => Shot, shot => shot.beanBatch)
  shots!: Shot[];
}
