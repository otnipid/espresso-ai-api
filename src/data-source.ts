import { DataSource } from "typeorm"
import "reflect-metadata"
import { Bean } from "./entities/Bean"
import { BeanBatch } from "./entities/BeanBatch"
import { Machine } from "./entities/Machine"
import { Shot } from "./entities/Shot"
import { ShotPreparation } from "./entities/ShotPreparation"
import { ShotExtraction } from "./entities/ShotExtraction"
import {ShotEnvironment} from "./entities/shotEnvironment"
import {ShotFeedback} from "./entities/shotFeedback"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "espresso_ml",
    synchronize: true,
    logging: false,
    entities: [Bean, BeanBatch, Machine, Shot, ShotPreparation, ShotExtraction, ShotEnvironment, ShotFeedback],
    migrations: [],
    subscribers: [],
})