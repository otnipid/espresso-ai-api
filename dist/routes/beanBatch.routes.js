"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/beanBatch.routes.ts
const express_1 = require("express");
const beanBatch_controller_1 = __importDefault(require("../controllers/beanBatch.controller"));
const router = (0, express_1.Router)();
// GET /api/batches - Get all bean batches
router.get('/', beanBatch_controller_1.default.all.bind(beanBatch_controller_1.default));
// GET /api/batches/:id - Get a single bean batch by ID
router.get('/:id', beanBatch_controller_1.default.one.bind(beanBatch_controller_1.default));
// POST /api/batches - Create a new bean batch
router.post('/', beanBatch_controller_1.default.save.bind(beanBatch_controller_1.default));
// PUT /api/batches/:id - Update a bean batch
router.put('/:id', beanBatch_controller_1.default.update.bind(beanBatch_controller_1.default));
// DELETE /api/batches/:id - Delete a bean batch
router.delete('/:id', beanBatch_controller_1.default.remove.bind(beanBatch_controller_1.default));
exports.default = router;
