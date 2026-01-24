"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const machine_controller_1 = __importDefault(require("../controllers/machine.controller"));
const router = (0, express_1.Router)();
// GET /api/machines - Get all machines
router.get('/', machine_controller_1.default.all.bind(machine_controller_1.default));
// GET /api/machines/:id - Get a single machine by ID
router.get('/:id', machine_controller_1.default.one.bind(machine_controller_1.default));
// POST /api/machines - Create a new machine
router.post('/', machine_controller_1.default.save.bind(machine_controller_1.default));
// PUT /api/machines/:id - Update a machine
router.put('/:id', machine_controller_1.default.update.bind(machine_controller_1.default));
// DELETE /api/machines/:id - Delete a machine
router.delete('/:id', machine_controller_1.default.remove.bind(machine_controller_1.default));
exports.default = router;
