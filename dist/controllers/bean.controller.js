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
exports.BeanController = void 0;
const data_source_1 = require("../data-source");
const Bean_1 = require("../entities/Bean");
class BeanController {
    constructor() {
        this.beanRepository = data_source_1.AppDataSource.getRepository(Bean_1.Bean);
    }
    all(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const beans = yield this.beanRepository.find({
                    relations: ['beanBatches']
                });
                response.json(beans);
            }
            catch (error) {
                console.error('Error fetching beans:', error);
                response.status(500).json({ message: 'Error fetching beans' });
            }
        });
    }
    one(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bean = yield this.beanRepository.findOne({
                    where: { id: request.params.id },
                    relations: ['beanBatches']
                });
                if (!bean) {
                    return response.status(404).json({ message: 'Bean not found' });
                }
                response.json(bean);
            }
            catch (error) {
                console.error('Error fetching bean:', error);
                response.status(500).json({ message: 'Error fetching bean' });
            }
        });
    }
    save(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, roaster, country, region, farm, varietal, processing_method, altitude_m, density_category } = request.body;
                if (!name) {
                    return response.status(400).json({ message: 'Name is required' });
                }
                const bean = this.beanRepository.create({
                    name,
                    roaster,
                    country,
                    region,
                    farm,
                    varietal,
                    processing_method,
                    altitude_m: altitude_m ? Number(altitude_m) : null,
                    density_category
                });
                const result = yield this.beanRepository.save(bean);
                response.status(201).json(result);
            }
            catch (error) {
                console.error('Error creating bean:', error);
                response.status(500).json({ message: 'Error creating bean' });
            }
        });
    }
    update(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { name, roaster, country, region, farm, varietal, processing_method, altitude_m, density_category } = request.body;
                const bean = yield this.beanRepository.findOne({
                    where: { id: request.params.id }
                });
                if (!bean) {
                    return response.status(404).json({ message: 'Bean not found' });
                }
                // Only update fields that are provided in the request
                if (name !== undefined)
                    bean.name = name;
                if (roaster !== undefined)
                    bean.roaster = roaster;
                if (country !== undefined)
                    bean.country = country;
                if (region !== undefined)
                    bean.region = region;
                if (farm !== undefined)
                    bean.farm = farm;
                if (varietal !== undefined)
                    bean.varietal = varietal;
                if (processing_method !== undefined)
                    bean.processing_method = processing_method;
                if (altitude_m !== undefined)
                    bean.altitude_m = altitude_m ? Number(altitude_m) : null;
                if (density_category !== undefined)
                    bean.density_category = density_category;
                const result = yield this.beanRepository.save(bean);
                response.json(result);
            }
            catch (error) {
                console.error('Error updating bean:', error);
                response.status(500).json({ message: 'Error updating bean' });
            }
        });
    }
    remove(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const bean = yield this.beanRepository.findOne({
                    where: { id: request.params.id }
                });
                if (!bean) {
                    return response.status(404).json({ message: 'Bean not found' });
                }
                yield this.beanRepository.remove(bean);
                response.status(204).send();
            }
            catch (error) {
                console.error('Error deleting bean:', error);
                response.status(500).json({ message: 'Error deleting bean' });
            }
        });
    }
}
exports.BeanController = BeanController;
exports.default = new BeanController();
