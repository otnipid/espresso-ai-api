"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/grinder.routes.ts
const express_1 = require("express");
const grinder_controller_1 = __importDefault(require("../controllers/grinder.controller"));
const router = (0, express_1.Router)();
// GET /api/grinders - Get all grinders
router.get('/', grinder_controller_1.default.all.bind(grinder_controller_1.default));
// GET /api/grinders/:id - Get a single grinder by ID
router.get('/:id', grinder_controller_1.default.one.bind(grinder_controller_1.default));
// POST /api/grinders - Create a new grinder
router.post('/', grinder_controller_1.default.save.bind(grinder_controller_1.default));
// PUT /api/grinders/:id - Update a grinder
router.put('/:id', grinder_controller_1.default.update.bind(grinder_controller_1.default));
// DELETE /api/grinders/:id - Delete a grinder
router.delete('/:id', grinder_controller_1.default.remove.bind(grinder_controller_1.default));
exports.default = router;
