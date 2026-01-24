// src/controllers/shotPreparation.controller.ts
import { Request, Response } from "express";
import { FindOptionsWhere } from "typeorm";
import { AppDataSource } from "../data-source";
import { ShotPreparation } from "../entities/ShotPreparation";

export class ShotPreparationController {
    private preparationRepository = AppDataSource.getRepository(ShotPreparation);

    async all(request: Request, response: Response) {
        try {
            const preparations = await this.preparationRepository.find();
            response.json(preparations);
        } catch (error) {
            console.error('Error fetching shot preparations:', error);
            response.status(500).json({ message: 'Error fetching shot preparations' });
        }
    }

    async one(request: Request, response: Response) {
        try {
            const preparation = await this.preparationRepository.findOne({
                where: { shot_id: request.params.id } as FindOptionsWhere<ShotPreparation>
            });

            if (!preparation) {
                return response.status(404).json({ message: 'Shot preparation not found' });
            }
            
            response.json(preparation);
        } catch (error) {
            console.error('Error fetching shot preparation:', error);
            response.status(500).json({ message: 'Error fetching shot preparation' });
        }
    }

    async save(request: Request, response: Response) {
        try {
            const { dose_grams, grind_setting, basket_type, basket_size_grams, distribution_method, tamp_type, tamp_pressure_category } = request.body;
            
            const preparation = this.preparationRepository.create({
                dose_grams: dose_grams ? parseFloat(dose_grams) : null,
                grind_setting: grind_setting ? parseFloat(grind_setting) : null,
                basket_type: basket_type || null,
                basket_size_grams: basket_size_grams ? parseInt(basket_size_grams) : null,
                distribution_method: distribution_method || null,
                tamp_type: tamp_type || null,
                tamp_pressure_category: tamp_pressure_category || null
            });

            const result = await this.preparationRepository.save(preparation);
            response.status(201).json(result);
        } catch (error) {
            console.error('Error creating shot preparation:', error);
            response.status(500).json({ message: 'Error creating shot preparation' });
        }
    }

    async update(request: Request, response: Response) {
        try {
            const { dose_grams, grind_setting, basket_type, basket_size_grams, distribution_method, tamp_type, tamp_pressure_category } = request.body;
            
            const preparation = await this.preparationRepository.findOne({
                where: { shot_id: request.params.id } as FindOptionsWhere<ShotPreparation>
            });

            if (!preparation) {
                return response.status(404).json({ message: 'Shot preparation not found' });
            }

            if (dose_grams !== undefined) preparation.dose_grams = dose_grams ? parseFloat(dose_grams) : null;
            if (grind_setting !== undefined) preparation.grind_setting = grind_setting ? parseFloat(grind_setting) : null;
            if (basket_type !== undefined) preparation.basket_type = basket_type || null;
            if (basket_size_grams !== undefined) preparation.basket_size_grams = basket_size_grams ? parseInt(basket_size_grams) : null;
            if (distribution_method !== undefined) preparation.distribution_method = distribution_method || null;
            if (tamp_type !== undefined) preparation.tamp_type = tamp_type || null;
            if (tamp_pressure_category !== undefined) preparation.tamp_pressure_category = tamp_pressure_category || null;

            const result = await this.preparationRepository.save(preparation);
            response.json(result);
        } catch (error) {
            console.error('Error updating shot preparation:', error);
            response.status(500).json({ message: 'Error updating shot preparation' });
        }
    }

    async remove(request: Request, response: Response) {
        try {
            const preparation = await this.preparationRepository.findOne({
                where: { shot_id: request.params.id } as FindOptionsWhere<ShotPreparation>
            });

            if (!preparation) {
                return response.status(404).json({ message: 'Shot preparation not found' });
            }

            await this.preparationRepository.remove(preparation);
            response.status(204).send();
        } catch (error) {
            console.error('Error deleting shot preparation:', error);
            response.status(500).json({ message: 'Error deleting shot preparation' });
        }
    }
}

export default new ShotPreparationController();