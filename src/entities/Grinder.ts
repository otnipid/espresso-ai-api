import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Shot } from './Shot';

@Entity('grinders')
export class Grinder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  model!: string;

  @Column({ type: 'text', nullable: true })
  manufacturer?: string | null;

  @Column({ name: 'burr_type', type: 'text', nullable: true })
  burrType?: string | null;

  @Column({ name: 'burr_install_date', type: 'date', nullable: true })
  burrInstallDate?: Date | null;

  @Column({ name: 'serial_number', type: 'text', unique: true, nullable: true })
  serialNumber?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at!: Date;

  @OneToMany(() => Shot, shot => shot.grinder)
  shots!: Shot[];
}
