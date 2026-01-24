// src/controllers/grinder.controller.ts
import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Grinder } from "../entities/Grinder";

export class GrinderController {
    private grinderRepository = AppDataSource.getRepository(Grinder);

    async all(request: Request, response: Response) {
        try {
            const grinders = await this.grinderRepository.find();
            response.json(grinders);
        } catch (error) {
            console.error('Error fetching grinders:', error);
            response.status(500).json({ message: 'Error fetching grinders' });
        }
    }

    async one(request: Request, response: Response) {
        try {
            const grinder = await this.grinderRepository.findOne({
                where: { id: request.params.id }
            });

            if (!grinder) {
                return response.status(404).json({ message: 'Grinder not found' });
            }
            
            response.json(grinder);
        } catch (error) {
            console.error('Error fetching grinder:', error);
            response.status(500).json({ message: 'Error fetching grinder' });
        }
    }

    async save(request: Request, response: Response) {
        try {
            const { model, burr_type, burr_install_date } = request.body;
            
            if (!model) {
                return response.status(400).json({ message: 'Model is required' });
            }

            const grinder = this.grinderRepository.create({
                model,
                burr_type,
                burr_install_date: burr_install_date ? new Date(burr_install_date) : null
            });

            const result = await this.grinderRepository.save(grinder);
            response.status(201).json(result);
        } catch (error) {
            console.error('Error creating grinder:', error);
            response.status(500).json({ message: 'Error creating grinder' });
        }
    }

    async update(request: Request, response: Response) {
        try {
            const { model, burr_type, burr_install_date } = request.body;
            
            const grinder = await this.grinderRepository.findOne({
                where: { id: request.params.id }
            });

            if (!grinder) {
                return response.status(404).json({ message: 'Grinder not found' });
            }

            if (model !== undefined) grinder.model = model;
            if (burr_type !== undefined) grinder.burr_type = burr_type;
            if (burr_install_date !== undefined) {
                grinder.burr_install_date = burr_install_date ? new Date(burr_install_date) : null;
            }

            const result = await this.grinderRepository.save(grinder);
            response.json(result);
        } catch (error) {
            console.error('Error updating grinder:', error);
            response.status(500).json({ message: 'Error updating grinder' });
        }
    }

    async remove(request: Request, response: Response) {
        try {
            const grinder = await this.grinderRepository.findOne({
                where: { id: request.params.id }
            });

            if (!grinder) {
                return response.status(404).json({ message: 'Grinder not found' });
            }

            await this.grinderRepository.remove(grinder);
            response.status(204).send();
        } catch (error) {
            console.error('Error deleting grinder:', error);
            response.status(500).json({ message: 'Error deleting grinder' });
        }
    }
}

export default new GrinderController();