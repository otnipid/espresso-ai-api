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
exports.ShotExtraction = void 0;
const typeorm_1 = require("typeorm");
const Shot_1 = require("./Shot");
let ShotExtraction = class ShotExtraction {
};
exports.ShotExtraction = ShotExtraction;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid' }),
    __metadata("design:type", String)
], ShotExtraction.prototype, "shot_id", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => Shot_1.Shot, shot => shot.extraction, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'shot_id' }),
    __metadata("design:type", Shot_1.Shot)
], ShotExtraction.prototype, "shot", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], ShotExtraction.prototype, "dose_grams", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], ShotExtraction.prototype, "yield_grams", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Object)
], ShotExtraction.prototype, "extraction_time_seconds", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], ShotExtraction.prototype, "temperature_celsius", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], ShotExtraction.prototype, "pressure_bars", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ShotExtraction.prototype, "notes", void 0);
exports.ShotExtraction = ShotExtraction = __decorate([
    (0, typeorm_1.Entity)("shot_extraction")
], ShotExtraction);
