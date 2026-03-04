import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Shot } from './Shot';

@Entity('machines')
export class Machine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  model!: string;

  @Column({ type: 'text', nullable: true })
  firmware_version?: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @OneToMany(() => Shot, shot => shot.machine)
  shots!: Shot[];
}
