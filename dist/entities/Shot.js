"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Shot = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const BeanBatch_1 = require("./BeanBatch");
const Machine_1 = require("./Machine");
const Grinder_1 = require("./Grinder");
const ShotPreparation_1 = require("./ShotPreparation");
const ShotExtraction_1 = require("./ShotExtraction");
let Shot = class Shot {
};
exports.Shot = Shot;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Shot.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, user => user.shots),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", User_1.User)
], Shot.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => BeanBatch_1.BeanBatch, beanBatch => beanBatch.shots),
    (0, typeorm_1.JoinColumn)({ name: 'bean_batch_id' }),
    __metadata("design:type", BeanBatch_1.BeanBatch)
], Shot.prototype, "beanBatch", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Machine_1.Machine, machine => machine.shots),
    (0, typeorm_1.JoinColumn)({ name: 'machine_id' }),
    __metadata("design:type", Machine_1.Machine)
], Shot.prototype, "machine", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Grinder_1.Grinder, grinder => grinder.shots),
    (0, typeorm_1.JoinColumn)({ name: 'grinder_id' }),
    __metadata("design:type", Grinder_1.Grinder)
], Shot.prototype, "grinder", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Shot.prototype, "shot_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Shot.prototype, "pulled_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true }),
    __metadata("design:type", Object)
], Shot.prototype, "success", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Shot.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Shot.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => ShotPreparation_1.ShotPreparation, preparation => preparation.shot),
    __metadata("design:type", ShotPreparation_1.ShotPreparation)
], Shot.prototype, "preparation", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => ShotExtraction_1.ShotExtraction, extraction => extraction.shot),
    __metadata("design:type", ShotExtraction_1.ShotExtraction)
], Shot.prototype, "extraction", void 0);
exports.Shot = Shot = __decorate([
    (0, typeorm_1.Entity)("shots")
], Shot);
