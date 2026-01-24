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
exports.ShotPreparationController = void 0;
const data_source_1 = require("../data-source");
const ShotPreparation_1 = require("../entities/ShotPreparation");
class ShotPreparationController {
    constructor() {
        this.preparationRepository = data_source_1.AppDataSource.getRepository(ShotPreparation_1.ShotPreparation);
    }
    all(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const preparations = yield this.preparationRepository.find();
                response.json(preparations);
            }
            catch (error) {
                console.error('Error fetching shot preparations:', error);
                response.status(500).json({ message: 'Error fetching shot preparations' });
            }
        });
    }
    one(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const preparation = yield this.preparationRepository.findOne({
                    where: { shot_id: request.params.id }
                });
                if (!preparation) {
                    return response.status(404).json({ message: 'Shot preparation not found' });
                }
                response.json(preparation);
            }
            catch (error) {
                console.error('Error fetching shot preparation:', error);
                response.status(500).json({ message: 'Error fetching shot preparation' });
            }
        });
    }
    save(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { dose_grams, grind_setting, basket_type, basket_size_grams, distribution_method, tamp_type, tamp_pressure_category } = request.body;
                const preparation = this.preparationRepository.create({
                    dose_grams: dose_grams ? parseFloat(dose_grams) : null,
                    grind_setting: grind_setting ? parseFloat(grind_setting) : null,
                    basket_type: basket_type || null,
                    basket_size_grams: basket_size_grams ? parseInt(basket_size_grams) : null,
                    distribution_method: distribution_method || null,
                    tamp_type: tamp_type || null,
                    tamp_pressure_category: tamp_pressure_category || null
                });
                const result = yield this.preparationRepository.save(preparation);
                response.status(201).json(result);
            }
            catch (error) {
                console.error('Error creating shot preparation:', error);
                response.status(500).json({ message: 'Error creating shot preparation' });
            }
        });
    }
    update(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { dose_grams, grind_setting, basket_type, basket_size_grams, distribution_method, tamp_type, tamp_pressure_category } = request.body;
                const preparation = yield this.preparationRepository.findOne({
                    where: { shot_id: request.params.id }
                });
                if (!preparation) {
                    return response.status(404).json({ message: 'Shot preparation not found' });
                }
                if (dose_grams !== undefined)
                    preparation.dose_grams = dose_grams ? parseFloat(dose_grams) : null;
                if (grind_setting !== undefined)
                    preparation.grind_setting = grind_setting ? parseFloat(grind_setting) : null;
                if (basket_type !== undefined)
                    preparation.basket_type = basket_type || null;
                if (basket_size_grams !== undefined)
                    preparation.basket_size_grams = basket_size_grams ? parseInt(basket_size_grams) : null;
                if (distribution_method !== undefined)
                    preparation.distribution_method = distribution_method || null;
                if (tamp_type !== undefined)
                    preparation.tamp_type = tamp_type || null;
                if (tamp_pressure_category !== undefined)
                    preparation.tamp_pressure_category = tamp_pressure_category || null;
                const result = yield this.preparationRepository.save(preparation);
                response.json(result);
            }
            catch (error) {
                console.error('Error updating shot preparation:', error);
                response.status(500).json({ message: 'Error updating shot preparation' });
            }
        });
    }
    remove(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const preparation = yield this.preparationRepository.findOne({
                    where: { shot_id: request.params.id }
                });
                if (!preparation) {
                    return response.status(404).json({ message: 'Shot preparation not found' });
                }
                yield this.preparationRepository.remove(preparation);
                response.status(204).send();
            }
            catch (error) {
                console.error('Error deleting shot preparation:', error);
                response.status(500).json({ message: 'Error deleting shot preparation' });
            }
        });
    }
}
exports.ShotPreparationController = ShotPreparationController;
exports.default = new ShotPreparationController();
