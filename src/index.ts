import 'dotenv/config';
import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source";
import cors from "cors";
import machineRoutes from "./routes/machine.routes";
import beanRoutes from "./routes/bean.routes";
import beanBatchRoutes from "./routes/beanBatch.routes";
import grinderRoutes from "./routes/grinder.routes";
import shotPreparationRoutes from "./routes/shotPreparation.routes";
import shotExtractionRoutes from "./routes/shotExtraction.routes";

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/machines", machineRoutes);
app.use("/api/beans", beanRoutes);
app.use("/api/batches", beanBatchRoutes);
app.use("/api/grinders", grinderRoutes);
app.use("/api/preparations", shotPreparationRoutes);
app.use("/api/extractions", shotExtractionRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

// Initialize database connection and start server
AppDataSource.initialize()
    .then(async () => {
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
    })
    .catch(error => {
        console.error("Error initializing database:", error);
        process.exit(1);
    });