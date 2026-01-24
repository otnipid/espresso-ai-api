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
exports.BeanBatchController = void 0;
const data_source_1 = require("../data-source");
const BeanBatch_1 = require("../entities/BeanBatch");
class BeanBatchController {
    constructor() {
        this.beanBatchRepository = data_source_1.AppDataSource.getRepository(BeanBatch_1.BeanBatch);
    }
    all(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const batches = yield this.beanBatchRepository.find({
                    relations: ['bean']
                });
                response.json(batches);
            }
            catch (error) {
                console.error('Error fetching bean batches:', error);
                response.status(500).json({ message: 'Error fetching bean batches' });
            }
        });
    }
    one(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const batch = yield this.beanBatchRepository.findOne({
                    where: { id: request.params.id },
                    relations: ['bean']
                });
                if (!batch) {
                    return response.status(404).json({ message: 'Bean batch not found' });
                }
                response.json(batch);
            }
            catch (error) {
                console.error('Error fetching bean batch:', error);
                response.status(500).json({ message: 'Error fetching bean batch' });
            }
        });
    }
    save(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { beanId, roastDate, bestByDate, weightKg, notes } = request.body;
                if (!beanId || !roastDate) {
                    return response.status(400).json({
                        message: 'Bean ID and roast date are required'
                    });
                }
                const batch = this.beanBatchRepository.create({
                    bean: { id: beanId },
                    roastDate: new Date(roastDate),
                    bestByDate: bestByDate ? new Date(bestByDate) : null,
                    weightKg: weightKg ? parseFloat(weightKg) : null,
                    notes: notes || null
                });
                const result = yield this.beanBatchRepository.save(batch);
                response.status(201).json(result);
            }
            catch (error) {
                console.error('Error creating bean batch:', error);
                response.status(500).json({ message: 'Error creating bean batch' });
            }
        });
    }
    update(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { beanId, roastDate, bestByDate, weightKg, notes } = request.body;
                const batch = yield this.beanBatchRepository.findOne({
                    where: { id: request.params.id }
                });
                if (!batch) {
                    return response.status(404).json({ message: 'Bean batch not found' });
                }
                if (beanId !== undefined)
                    batch.bean = { id: beanId };
                if (roastDate !== undefined)
                    batch.roastDate = new Date(roastDate);
                if (bestByDate !== undefined) {
                    batch.bestByDate = bestByDate ? new Date(bestByDate) : null;
                }
                if (weightKg !== undefined) {
                    batch.weightKg = weightKg ? parseFloat(weightKg) : null;
                }
                if (notes !== undefined)
                    batch.notes = notes;
                const result = yield this.beanBatchRepository.save(batch);
                response.json(result);
            }
            catch (error) {
                console.error('Error updating bean batch:', error);
                response.status(500).json({ message: 'Error updating bean batch' });
            }
        });
    }
    remove(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const batch = yield this.beanBatchRepository.findOne({
                    where: { id: request.params.id }
                });
                if (!batch) {
                    return response.status(404).json({ message: 'Bean batch not found' });
                }
                yield this.beanBatchRepository.remove(batch);
                response.status(204).send();
            }
            catch (error) {
                console.error('Error deleting bean batch:', error);
                response.status(500).json({ message: 'Error deleting bean batch' });
            }
        });
    }
}
exports.BeanBatchController = BeanBatchController;
exports.default = new BeanBatchController();
