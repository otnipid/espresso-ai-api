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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const data_source_1 = require("./data-source");
const cors_1 = __importDefault(require("cors"));
const machine_routes_1 = __importDefault(require("./routes/machine.routes"));
const bean_routes_1 = __importDefault(require("./routes/bean.routes"));
const beanBatch_routes_1 = __importDefault(require("./routes/beanBatch.routes"));
const grinder_routes_1 = __importDefault(require("./routes/grinder.routes"));
const shotPreparation_routes_1 = __importDefault(require("./routes/shotPreparation.routes"));
const shotExtraction_routes_1 = __importDefault(require("./routes/shotExtraction.routes"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API Routes
app.use("/api/machines", machine_routes_1.default);
app.use("/api/beans", bean_routes_1.default);
app.use("/api/batches", beanBatch_routes_1.default);
app.use("/api/grinders", grinder_routes_1.default);
app.use("/api/preparations", shotPreparation_routes_1.default);
app.use("/api/extractions", shotExtraction_routes_1.default);
// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
});
// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});
// Initialize database connection and start server
data_source_1.AppDataSource.initialize()
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Database connection established");
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
        console.log("Available endpoints:");
        console.log(`  GET    /api/machines`);
        console.log(`  POST   /api/machines`);
        console.log(`  GET    /api/machines/:id`);
        console.log(`  PUT    /api/machines/:id`);
        console.log(`  DELETE /api/machines/:id`);
        console.log(`  GET    /api/beans`);
        console.log(`  POST   /api/beans`);
        console.log(`  GET    /api/beans/:id`);
        console.log(`  PUT    /api/beans/:id`);
        console.log(`  DELETE /api/beans/:id`);
        console.log(`  GET    /api/batches`);
        console.log(`  POST   /api/batches`);
        console.log(`  GET    /api/batches/:id`);
        console.log(`  PUT    /api/batches/:id`);
        console.log(`  DELETE /api/batches/:id`);
        console.log(`  GET    /api/grinders`);
        console.log(`  POST   /api/grinders`);
        console.log(`  GET    /api/grinders/:id`);
        console.log(`  PUT    /api/grinders/:id`);
        console.log(`  DELETE /api/grinders/:id`);
        console.log(`  GET    /api/preparations`);
        console.log(`  POST   /api/preparations`);
        console.log(`  GET    /api/preparations/:id`);
        console.log(`  PUT    /api/preparations/:id`);
        console.log(`  DELETE /api/preparations/:id`);
        console.log(`  GET    /api/extractions`);
        console.log(`  POST   /api/extractions`);
        console.log(`  GET    /api/extractions/:id`);
        console.log(`  PUT    /api/extractions/:id`);
        console.log(`  DELETE /api/extractions/:id`);
        console.log(`  GET    /health`);
    });
}))
    .catch(error => {
    console.error("Error initializing database:", error);
    process.exit(1);
});
