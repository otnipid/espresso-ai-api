"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/shotPreparation.routes.ts
const express_1 = require("express");
const shotPreparation_controller_1 = __importDefault(require("../controllers/shotPreparation.controller"));
const router = (0, express_1.Router)();
// GET /api/preparations - Get all shot preparations
router.get('/', shotPreparation_controller_1.default.all.bind(shotPreparation_controller_1.default));
// GET /api/preparations/:id - Get a single shot preparation by ID
router.get('/:id', shotPreparation_controller_1.default.one.bind(shotPreparation_controller_1.default));
// POST /api/preparations - Create a new shot preparation
router.post('/', shotPreparation_controller_1.default.save.bind(shotPreparation_controller_1.default));
// PUT /api/preparations/:id - Update a shot preparation
router.put('/:id', shotPreparation_controller_1.default.update.bind(shotPreparation_controller_1.default));
// DELETE /api/preparations/:id - Delete a shot preparation
router.delete('/:id', shotPreparation_controller_1.default.remove.bind(shotPreparation_controller_1.default));
exports.default = router;
