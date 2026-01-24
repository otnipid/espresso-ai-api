"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bean_controller_1 = __importDefault(require("../controllers/bean.controller"));
const router = (0, express_1.Router)();
// GET /api/beans - Get all beans
router.get('/', bean_controller_1.default.all.bind(bean_controller_1.default));
// GET /api/beans/:id - Get a single bean by ID
router.get('/:id', bean_controller_1.default.one.bind(bean_controller_1.default));
// POST /api/beans - Create a new bean
router.post('/', bean_controller_1.default.save.bind(bean_controller_1.default));
// PUT /api/beans/:id - Update a bean
router.put('/:id', bean_controller_1.default.update.bind(bean_controller_1.default));
// DELETE /api/beans/:id - Delete a bean
router.delete('/:id', bean_controller_1.default.remove.bind(bean_controller_1.default));
exports.default = router;
