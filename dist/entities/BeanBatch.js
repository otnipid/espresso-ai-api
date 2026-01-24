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
exports.BeanBatch = void 0;
const typeorm_1 = require("typeorm");
const Bean_1 = require("./Bean");
const Shot_1 = require("./Shot");
let BeanBatch = class BeanBatch {
};
exports.BeanBatch = BeanBatch;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], BeanBatch.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Bean_1.Bean, bean => bean.beanBatches),
    __metadata("design:type", Bean_1.Bean)
], BeanBatch.prototype, "bean", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], BeanBatch.prototype, "roastDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], BeanBatch.prototype, "bestByDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], BeanBatch.prototype, "weightKg", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], BeanBatch.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], BeanBatch.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Shot_1.Shot, shot => shot.beanBatch),
    __metadata("design:type", Array)
], BeanBatch.prototype, "shots", void 0);
exports.BeanBatch = BeanBatch = __decorate([
    (0, typeorm_1.Entity)("bean_batches")
], BeanBatch);
