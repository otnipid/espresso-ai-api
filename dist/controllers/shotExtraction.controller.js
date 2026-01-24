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
exports.ShotExtractionController = void 0;
const data_source_1 = require("../data-source");
const ShotExtraction_1 = require("../entities/ShotExtraction");
class ShotExtractionController {
    constructor() {
        this.extractionRepository = data_source_1.AppDataSource.getRepository(ShotExtraction_1.ShotExtraction);
    }
    all(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const extractions = yield this.extractionRepository.find();
                response.json(extractions);
            }
            catch (error) {
                console.error('Error fetching shot extractions:', error);
                response.status(500).json({ message: 'Error fetching shot extractions' });
            }
        });
    }
    one(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const extraction = yield this.extractionRepository.findOne({
                    where: { id: request.params.id }
                });
                if (!extraction) {
                    return response.status(404).json({ message: 'Shot extraction not found' });
                }
                response.json(extraction);
            }
            catch (error) {
                console.error('Error fetching shot extraction:', error);
                response.status(500).json({ message: 'Error fetching shot extraction' });
            }
        });
    }
    save(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { yield_grams, extraction_time_seconds, pressure_bars, notes } = request.body;
                const extraction = this.extractionRepository.create({
                    yield_grams: yield_grams ? parseFloat(yield_grams) : null,
                    extraction_time_seconds: extraction_time_seconds ? parseInt(extraction_time_seconds) : null,
                    pressure_bars: pressure_bars ? parseFloat(pressure_bars) : null,
                    notes: notes || null
                });
                const result = yield this.extractionRepository.save(extraction);
                response.status(201).json(result);
            }
            catch (error) {
                console.error('Error creating shot extraction:', error);
                response.status(500).json({ message: 'Error creating shot extraction' });
            }
        });
    }
    update(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { yield_grams, extraction_time_seconds, pressure_bars, notes } = request.body;
                const extraction = yield this.extractionRepository.findOne({
                    where: { shot_id: request.params.id }
                });
                if (!extraction) {
                    return response.status(404).json({ message: 'Shot extraction not found' });
                }
                if (yield_grams !== undefined)
                    extraction.yield_grams = yield_grams ? parseFloat(yield_grams) : null;
                if (extraction_time_seconds !== undefined)
                    extraction.extraction_time_seconds = extraction_time_seconds ? parseInt(extraction_time_seconds) : null;
                if (pressure_bars !== undefined)
                    extraction.pressure_bars = pressure_bars ? parseFloat(pressure_bars) : null;
                if (notes !== undefined)
                    extraction.notes = notes;
                const result = yield this.extractionRepository.save(extraction);
                response.json(result);
            }
            catch (error) {
                console.error('Error updating shot extraction:', error);
                response.status(500).json({ message: 'Error updating shot extraction' });
            }
        });
    }
    remove(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const extraction = yield this.extractionRepository.findOne({
                    where: { shot_id: request.params.id }
                });
                if (!extraction) {
                    return response.status(404).json({ message: 'Shot extraction not found' });
                }
                yield this.extractionRepository.remove(extraction);
                response.status(204).send();
            }
            catch (error) {
                console.error('Error deleting shot extraction:', error);
                response.status(500).json({ message: 'Error deleting shot extraction' });
            }
        });
    }
}
exports.ShotExtractionController = ShotExtractionController;
exports.default = new ShotExtractionController();
