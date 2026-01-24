import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Shot } from "./Shot";

@Entity("grinders")
export class Grinder {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'text' })
    model!: string;

    @Column({ type: 'text', nullable: true })
    burr_type?: string | null;

    @Column({ type: 'date', nullable: true })
    burr_install_date?: Date | null;

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;

    @OneToMany(() => Shot, shot => shot.grinder)
    shots!: Shot[];
}