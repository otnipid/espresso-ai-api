"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShotController = void 0;
const data_source_1 = require("../data-source");
const Shot_1 = require("../entities/Shot");
const ShotPreparation_1 = require("../entities/ShotPreparation");
const ShotExtraction_1 = require("../entities/ShotExtraction");
class ShotController {
    constructor() {
        this.shotRepository = data_source_1.AppDataSource.getRepository(Shot_1.Shot);
        this.shotPreparationRepository = data_source_1.AppDataSource.getRepository(ShotPreparation_1.ShotPreparation);
        this.shotExtractionRepository = data_source_1.AppDataSource.getRepository(ShotExtraction_1.ShotExtraction);
    }
    all(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const shots = yield this.shotRepository.find({
                    relations: ['grinder', 'machine', 'beanBatch', 'preparation', 'extraction']
                });
                response.json(shots);
            }
            catch (error) {
                console.error('Error fetching shots:', error);
                response.status(500).json({ message: 'Error fetching shots' });
            }
        });
    }
    one(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const shot = yield this.shotRepository.findOne({
                    where: { id: request.params.id },
                    relations: ['grinder', 'machine', 'beanBatch', 'preparation', 'extraction']
                });
                if (!shot) {
                    return response.status(404).json({ message: 'Shot not found' });
                }
                response.json(shot);
            }
            catch (error) {
                console.error('Error fetching shot:', error);
                response.status(500).json({ message: 'Error fetching shot' });
            }
        });
    }
    save(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryRunner = data_source_1.AppDataSource.createQueryRunner();
            try {
                const { grinderId, machineId, beanBatchId, preparation, extraction, notes } = request.body;
                // Validate required fields
                if (!grinderId || !machineId || !beanBatchId || !preparation || !extraction) {
                    return response.status(400).json({
                        message: 'grinderId, machineId, beanBatchId, preparation, and extraction are required'
                    });
                }
                yield queryRunner.connect();
                yield queryRunner.startTransaction();
                // Create preparation
                const prep = this.shotPreparationRepository.create(preparation);
                const savedPrep = yield queryRunner.manager.save(prep);
                // Create extraction
                const extr = this.shotExtractionRepository.create(extraction);
                const savedExtr = yield queryRunner.manager.save(extr);
                // Create shot
                const shotData = {
                    grinder: { id: grinderId },
                    machine: { id: machineId },
                    beanBatch: { id: beanBatchId },
                    preparation: savedPrep,
                    extraction: savedExtr,
                    notes: notes || null
                };
                const result = yield queryRunner.manager.save(shotData);
                yield queryRunner.commitTransaction();
                response.status(201).json(result);
            }
            catch (error) {
                yield queryRunner.rollbackTransaction();
                console.error('Error creating shot:', error);
                response.status(500).json({ message: 'Error creating shot' });
            }
            finally {
                yield queryRunner.release();
            }
        });
    }
    update(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryRunner = data_source_1.AppDataSource.createQueryRunner();
            try {
                const { grinderId, machineId, beanBatchId, preparation, extraction, notes } = request.body;
                yield queryRunner.connect();
                yield queryRunner.startTransaction();
                // Find the shot with relations
                const shot = yield this.shotRepository.findOne({
                    where: { id: request.params.id },
                    relations: ['preparation', 'extraction']
                });
                if (!shot) {
                    return response.status(404).json({ message: 'Shot not found' });
                }
                // Update basic fields
                if (grinderId !== undefined)
                    shot.grinder = { id: grinderId };
                if (machineId !== undefined)
                    shot.machine = { id: machineId };
                if (beanBatchId !== undefined)
                    shot.beanBatch = { id: beanBatchId };
                if (notes !== undefined)
                    shot.notes = notes;
                // Update preparation if provided
                if (preparation) {
                    if (!shot.preparation) {
                        shot.preparation = new ShotPreparation_1.ShotPreparation();
                    }
                    Object.assign(shot.preparation, preparation);
                    yield queryRunner.manager.save(shot.preparation);
                }
                // Update extraction if provided
                if (extraction) {
                    if (!shot.extraction) {
                        shot.extraction = new ShotExtraction_1.ShotExtraction();
                    }
                    Object.assign(shot.extraction, extraction);
                    yield queryRunner.manager.save(shot.extraction);
                }
                const result = yield queryRunner.manager.save(shot);
                yield queryRunner.commitTransaction();
                response.json(result);
            }
            catch (error) {
                yield queryRunner.rollbackTransaction();
                console.error('Error updating shot:', error);
                response.status(500).json({ message: 'Error updating shot' });
            }
            finally {
                yield queryRunner.release();
            }
        });
    }
    remove(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const shot = yield this.shotRepository.findOne({
                    where: { id: request.params.id },
                    relations: ['preparation', 'extraction']
                });
                if (!shot) {
                    return response.status(404).json({ message: 'Shot not found' });
                }
                // Delete the shot and its related entities
                yield this.shotRepository.remove(shot);
                if (shot.preparation) {
                    yield this.shotPreparationRepository.remove(shot.preparation);
                }
                if (shot.extraction) {
                    yield this.shotExtractionRepository.remove(shot.extraction);
                }
                response.status(204).send();
            }
            catch (error) {
                console.error('Error deleting shot:', error);
                response.status(500).json({ message: 'Error deleting shot' });
            }
        });
    }
}
exports.ShotController = ShotController;
exports.default = new ShotController();
