import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Shot } from './Shot';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', unique: true, nullable: true })
  email?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at!: Date;

  @OneToMany(() => Shot, shot => shot.user)
  shots!: Shot[];

  @OneToMany(() => Shot, shot => shot.createdBy)
  createdShots!: Shot[];

  @OneToMany(() => Shot, shot => shot.updatedBy)
  updatedShots!: Shot[];
}
