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
exports.MachineController = void 0;
const data_source_1 = require("../data-source");
const Machine_1 = require("../entities/Machine");
class MachineController {
    constructor() {
        this.machineRepository = data_source_1.AppDataSource.getRepository(Machine_1.Machine);
    }
    all(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const machines = yield this.machineRepository.find();
                response.json(machines);
            }
            catch (error) {
                console.error('Error fetching machines:', error);
                response.status(500).json({ message: 'Error fetching machines' });
            }
        });
    }
    one(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const machine = yield this.machineRepository.findOne({
                    where: { id: request.params.id }
                });
                if (!machine) {
                    return response.status(404).json({ message: 'Machine not found' });
                }
                response.json(machine);
            }
            catch (error) {
                console.error('Error fetching machine:', error);
                response.status(500).json({ message: 'Error fetching machine' });
            }
        });
    }
    save(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { model, firmware_version } = request.body;
                if (!model) {
                    return response.status(400).json({ message: 'Model is required' });
                }
                const machine = this.machineRepository.create({
                    model,
                    firmware_version
                });
                const result = yield this.machineRepository.save(machine);
                response.status(201).json(result);
            }
            catch (error) {
                console.error('Error creating machine:', error);
                response.status(500).json({ message: 'Error creating machine' });
            }
        });
    }
    update(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { model, firmware_version } = request.body;
                const machine = yield this.machineRepository.findOne({
                    where: { id: request.params.id }
                });
                if (!machine) {
                    return response.status(404).json({ message: 'Machine not found' });
                }
                machine.model = model || machine.model;
                if (firmware_version !== undefined) {
                    machine.firmware_version = firmware_version;
                }
                const result = yield this.machineRepository.save(machine);
                response.json(result);
            }
            catch (error) {
                console.error('Error updating machine:', error);
                response.status(500).json({ message: 'Error updating machine' });
            }
        });
    }
    remove(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const machine = yield this.machineRepository.findOne({
                    where: { id: request.params.id }
                });
                if (!machine) {
                    return response.status(404).json({ message: 'Machine not found' });
                }
                yield this.machineRepository.remove(machine);
                response.status(204).send();
            }
            catch (error) {
                console.error('Error deleting machine:', error);
                response.status(500).json({ message: 'Error deleting machine' });
            }
        });
    }
}
exports.MachineController = MachineController;
exports.default = new MachineController();
