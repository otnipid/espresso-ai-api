import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Shot } from './Shot';

@Entity('bean_batches')
export class BeanBatch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  roaster?: string | null;

  @Column({ type: 'text', nullable: true })
  country?: string | null;

  @Column({ name: 'roast_date', type: 'date' })
  roastDate!: Date;

  @Column({ name: 'bag_open_date', type: 'date', nullable: true })
  bagOpenDate?: Date | null;

  @Column({ name: 'roast_level', type: 'text', nullable: true })
  roastLevel?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => Shot, shot => shot.beanBatch)
  shots!: Shot[];
}
