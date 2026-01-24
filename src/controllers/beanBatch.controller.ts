// src/controllers/beanBatch.controller.ts
import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { BeanBatch } from "../entities/BeanBatch";

export class BeanBatchController {
    private beanBatchRepository = AppDataSource.getRepository(BeanBatch);

    async all(request: Request, response: Response) {
        try {
            const batches = await this.beanBatchRepository.find({
                relations: ['bean']
            });
            response.json(batches);
        } catch (error) {
            console.error('Error fetching bean batches:', error);
            response.status(500).json({ message: 'Error fetching bean batches' });
        }
    }

    async one(request: Request, response: Response) {
        try {
            const batch = await this.beanBatchRepository.findOne({
                where: { id: request.params.id },
                relations: ['bean']
            });

            if (!batch) {
                return response.status(404).json({ message: 'Bean batch not found' });
            }
            
            response.json(batch);
        } catch (error) {
            console.error('Error fetching bean batch:', error);
            response.status(500).json({ message: 'Error fetching bean batch' });
        }
    }

    async save(request: Request, response: Response) {
        try {
            const { beanId, roastDate, bestByDate, weightKg, notes } = request.body;
            
            if (!beanId || !roastDate) {
                return response.status(400).json({ 
                    message: 'Bean ID and roast date are required' 
                });
            }

            const batch = this.beanBatchRepository.create({
                bean: { id: beanId },
                roastDate: new Date(roastDate),
                bestByDate: bestByDate ? new Date(bestByDate) : null,
                weightKg: weightKg ? parseFloat(weightKg) : null,
                notes: notes || null
            });

            const result = await this.beanBatchRepository.save(batch);
            response.status(201).json(result);
        } catch (error) {
            console.error('Error creating bean batch:', error);
            response.status(500).json({ message: 'Error creating bean batch' });
        }
    }

    async update(request: Request, response: Response) {
        try {
            const { beanId, roastDate, bestByDate, weightKg, notes } = request.body;
            
            const batch = await this.beanBatchRepository.findOne({
                where: { id: request.params.id }
            });

            if (!batch) {
                return response.status(404).json({ message: 'Bean batch not found' });
            }

            if (beanId !== undefined) batch.bean = { id: beanId } as any;
            if (roastDate !== undefined) batch.roastDate = new Date(roastDate);
            if (bestByDate !== undefined) {
                batch.bestByDate = bestByDate ? new Date(bestByDate) : null;
            }
            if (weightKg !== undefined) {
                batch.weightKg = weightKg ? parseFloat(weightKg) : null;
            }
            if (notes !== undefined) batch.notes = notes;

            const result = await this.beanBatchRepository.save(batch);
            response.json(result);
        } catch (error) {
            console.error('Error updating bean batch:', error);
            response.status(500).json({ message: 'Error updating bean batch' });
        }
    }

    async remove(request: Request, response: Response) {
        try {
            const batch = await this.beanBatchRepository.findOne({
                where: { id: request.params.id }
            });

            if (!batch) {
                return response.status(404).json({ message: 'Bean batch not found' });
            }

            await this.beanBatchRepository.remove(batch);
            response.status(204).send();
        } catch (error) {
            console.error('Error deleting bean batch:', error);
            response.status(500).json({ message: 'Error deleting bean batch' });
        }
    }
}

export default new BeanBatchController();