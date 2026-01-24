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
exports.GrinderController = void 0;
const data_source_1 = require("../data-source");
const Grinder_1 = require("../entities/Grinder");
class GrinderController {
    constructor() {
        this.grinderRepository = data_source_1.AppDataSource.getRepository(Grinder_1.Grinder);
    }
    all(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const grinders = yield this.grinderRepository.find();
                response.json(grinders);
            }
            catch (error) {
                console.error('Error fetching grinders:', error);
                response.status(500).json({ message: 'Error fetching grinders' });
            }
        });
    }
    one(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const grinder = yield this.grinderRepository.findOne({
                    where: { id: request.params.id }
                });
                if (!grinder) {
                    return response.status(404).json({ message: 'Grinder not found' });
                }
                response.json(grinder);
            }
            catch (error) {
                console.error('Error fetching grinder:', error);
                response.status(500).json({ message: 'Error fetching grinder' });
            }
        });
    }
    save(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { model, burr_type, burr_install_date } = request.body;
                if (!model) {
                    return response.status(400).json({ message: 'Model is required' });
                }
                const grinder = this.grinderRepository.create({
                    model,
                    burr_type,
                    burr_install_date: burr_install_date ? new Date(burr_install_date) : null
                });
                const result = yield this.grinderRepository.save(grinder);
                response.status(201).json(result);
            }
            catch (error) {
                console.error('Error creating grinder:', error);
                response.status(500).json({ message: 'Error creating grinder' });
            }
        });
    }
    update(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { model, burr_type, burr_install_date } = request.body;
                const grinder = yield this.grinderRepository.findOne({
                    where: { id: request.params.id }
                });
                if (!grinder) {
                    return response.status(404).json({ message: 'Grinder not found' });
                }
                if (model !== undefined)
                    grinder.model = model;
                if (burr_type !== undefined)
                    grinder.burr_type = burr_type;
                if (burr_install_date !== undefined) {
                    grinder.burr_install_date = burr_install_date ? new Date(burr_install_date) : null;
                }
                const result = yield this.grinderRepository.save(grinder);
                response.json(result);
            }
            catch (error) {
                console.error('Error updating grinder:', error);
                response.status(500).json({ message: 'Error updating grinder' });
            }
        });
    }
    remove(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const grinder = yield this.grinderRepository.findOne({
                    where: { id: request.params.id }
                });
                if (!grinder) {
                    return response.status(404).json({ message: 'Grinder not found' });
                }
                yield this.grinderRepository.remove(grinder);
                response.status(204).send();
            }
            catch (error) {
                console.error('Error deleting grinder:', error);
                response.status(500).json({ message: 'Error deleting grinder' });
            }
        });
    }
}
exports.GrinderController = GrinderController;
exports.default = new GrinderController();
