"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const User_1 = require("./entities/User");
const typeorm_1 = require("typeorm");
require("reflect-metadata");
const Bean_1 = require("./entities/Bean");
const BeanBatch_1 = require("./entities/BeanBatch");
const Machine_1 = require("./entities/Machine");
const Grinder_1 = require("./entities/Grinder");
const Shot_1 = require("./entities/Shot");
const ShotPreparation_1 = require("./entities/ShotPreparation");
const ShotExtraction_1 = require("./entities/ShotExtraction");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "espresso_ml",
    synchronize: true,
    logging: false,
    entities: [User_1.User, Bean_1.Bean, BeanBatch_1.BeanBatch, Machine_1.Machine, Grinder_1.Grinder, Shot_1.Shot, ShotPreparation_1.ShotPreparation, ShotExtraction_1.ShotExtraction],
    migrations: [],
    subscribers: [],
});
