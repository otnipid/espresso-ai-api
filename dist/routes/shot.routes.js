"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/shot.routes.ts
const express_1 = require("express");
const shot_controller_1 = __importDefault(require("../controllers/shot.controller"));
const router = (0, express_1.Router)();
// GET /api/shots - Get all shots
router.get('/', shot_controller_1.default.all.bind(shot_controller_1.default));
// GET /api/shots/:id - Get a single shot by ID
router.get('/:id', shot_controller_1.default.one.bind(shot_controller_1.default));
// POST /api/shots - Create a new shot
router.post('/', shot_controller_1.default.save.bind(shot_controller_1.default));
// PUT /api/shots/:id - Update a shot
router.put('/:id', shot_controller_1.default.update.bind(shot_controller_1.default));
// DELETE /api/shots/:id - Delete a shot
router.delete('/:id', shot_controller_1.default.remove.bind(shot_controller_1.default));
exports.default = router;
