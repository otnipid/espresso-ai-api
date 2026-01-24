"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/shotExtraction.routes.ts
const express_1 = require("express");
const shotExtraction_controller_1 = __importDefault(require("../controllers/shotExtraction.controller"));
const router = (0, express_1.Router)();
// GET /api/extractions - Get all shot extractions
router.get('/', shotExtraction_controller_1.default.all.bind(shotExtraction_controller_1.default));
// GET /api/extractions/:id - Get a single shot extraction by ID
router.get('/:id', shotExtraction_controller_1.default.one.bind(shotExtraction_controller_1.default));
// POST /api/extractions - Create a new shot extraction
router.post('/', shotExtraction_controller_1.default.save.bind(shotExtraction_controller_1.default));
// PUT /api/extractions/:id - Update a shot extraction
router.put('/:id', shotExtraction_controller_1.default.update.bind(shotExtraction_controller_1.default));
// DELETE /api/extractions/:id - Delete a shot extraction
router.delete('/:id', shotExtraction_controller_1.default.remove.bind(shotExtraction_controller_1.default));
exports.default = router;
