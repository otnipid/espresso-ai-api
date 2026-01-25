// src/controllers/shot.controller.ts
import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { ShotFeedback } from "../entities/shotFeedback";
import { FindOptionsWhere } from "typeorm";

export class ShotFeedbackController {
    private shotFeedbackRepository = AppDataSource.getRepository(ShotFeedback);

    async all(request: Request, response: Response) {
        try {
            const feedbacks = await this.shotFeedbackRepository.find();
            response.json(feedbacks);
        } catch (error) {
            console.error('Error fetching shot feedbacks:', error);
            response.status(500).json({ message: 'Error fetching shot feedbacks' });
        }
    }

    async one(request: Request, response: Response) {
        try {
            const feedback = await this.shotFeedbackRepository.findOne({
            where: { id: request.params.id } as FindOptionsWhere<ShotFeedback>
            });

            if (!feedback) {
                return response.status(404).json({ message: 'Shot feedback not found' });
            }
            
            response.json(feedback);
        } catch (error) {
            console.error('Error fetching shot feedback:', error);
            response.status(500).json({ message: 'Error fetching shot feedback' });
        }
    }

    async save(request: Request, response: Response) {
        try {
            const { overall_score, acidity, sweetness, bitterness, body, extraction_assessment, notes } = request.body;
            
            const feedback = this.shotFeedbackRepository.create({
                overall_score: overall_score ? parseInt(overall_score) : null,
                acidity: acidity ? parseInt(acidity): null,
                sweetness: sweetness ? parseInt(sweetness): null,
                bitterness: bitterness ? parseInt(bitterness): null,
                body: body ? parseInt(body): null,
                extraction_assessment: extraction_assessment,
                notes: notes
            });

            const result = await this.shotFeedbackRepository.save(feedback);
            response.status(201).json(result);
        } catch (error) {
            console.error('Error creating shot:', error);
            response.status(500).json({ message: 'Error creating shot' });
        }
    }

    async update(request: Request, response: Response) {
        try {
            const { overall_score, acidity, sweetness, bitterness, body, extraction_assessment, notes } = request.body;
            
            // Find the shot with relations
            const feedback = await this.shotFeedbackRepository.findOne({
                where: { shot_id: request.params.id } as FindOptionsWhere<ShotFeedback>
            });

            if (!feedback) {
                return response.status(404).json({ message: 'Shot feedback not found' });
            }

            // Update basic fields
            if (overall_score !== undefined) feedback.overall_score = overall_score ? parseInt(overall_score) : null;
            if (acidity !== undefined) feedback.acidity = acidity ? parseInt(acidity) : null;
            if (sweetness !== undefined) feedback.sweetness = sweetness ? parseInt(sweetness) : null;
            if (bitterness !== undefined) feedback.bitterness = bitterness ? parseInt(bitterness) : null;
            if (body !== undefined) feedback.body = body ? parseInt(body) : null;
            if (extraction_assessment !== undefined) feedback.extraction_assessment = extraction_assessment;
            if (notes !== undefined) feedback.notes = notes;

            const result = await this.shotFeedbackRepository.save(feedback);
            response.json(result);
        } catch (error) {
            console.error('Error updating shot:', error);
            response.status(500).json({ message: 'Error updating shot' });
        }
    }

    async remove(request: Request, response: Response) {
        try {
            const feedback = await this.shotFeedbackRepository.findOne({
                where: { shot_id: request.params.id } as FindOptionsWhere<ShotFeedback>
            });

            if (!feedback) {
                return response.status(404).json({ message: 'Shot feedback not found' });
            }

            await this.shotFeedbackRepository.remove(feedback);
            response.status(204).send();
        } catch (error) {
            console.error('Error deleting shot feedback:', error);
            response.status(500).json({ message: 'Error deleting shot feedback' });
        }
    }
}

export default new ShotFeedbackController();