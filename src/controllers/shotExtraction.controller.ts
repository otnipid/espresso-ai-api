import { FindOptionsWhere } from "typeorm";
import { AppDataSource } from "../data-source";
import { ShotExtraction } from "../entities/ShotExtraction";

export class ShotExtractionController {
    private extractionRepository = AppDataSource.getRepository(ShotExtraction);

    async all(request: Request, response: Response) {
        try {
            const extractions = await this.extractionRepository.find();
            response.json(extractions);
        } catch (error) {
            console.error('Error fetching shot extractions:', error);
            response.status(500).json({ message: 'Error fetching shot extractions' });
        }
    }

    async one(request: Request, response: Response) {
        try {
              const extraction = await this.extractionRepository.findOne({
                where: { id: request.params.id } as FindOptionsWhere<ShotExtraction>
            });

            if (!extraction) {
                return response.status(404).json({ message: 'Shot extraction not found' });
            }
            
            response.json(extraction);
        } catch (error) {
            console.error('Error fetching shot extraction:', error);
            response.status(500).json({ message: 'Error fetching shot extraction' });
        }
    }

    async save(request: Request, response: Response) {
        try {
            const { yield_grams, extraction_time_seconds, pressure_bars, notes } = request.body;
            
            const extraction = this.extractionRepository.create({
                yield_grams: yield_grams ? parseFloat(yield_grams) : null,
                extraction_time_seconds: extraction_time_seconds ? parseInt(extraction_time_seconds) : null,
                pressure_bars: pressure_bars ? parseFloat(pressure_bars) : null,
                notes: notes || null
            });

            const result = await this.extractionRepository.save(extraction);
            response.status(201).json(result);
        } catch (error) {
            console.error('Error creating shot extraction:', error);
            response.status(500).json({ message: 'Error creating shot extraction' });
        }
    }

    async update(request: Request, response: Response) {
        try {
            const { yield_grams, extraction_time_seconds, pressure_bars, notes } = request.body;
            
            const extraction = await this.extractionRepository.findOne({
                where: { shot_id: request.params.id } as FindOptionsWhere<ShotExtraction>
            });

            if (!extraction) {
                return response.status(404).json({ message: 'Shot extraction not found' });
            }

            if (yield_grams !== undefined) extraction.yield_grams = yield_grams ? parseFloat(yield_grams) : null;
            if (extraction_time_seconds !== undefined) extraction.extraction_time_seconds = extraction_time_seconds ? parseInt(extraction_time_seconds) : null;
            if (pressure_bars !== undefined) extraction.pressure_bars = pressure_bars ? parseFloat(pressure_bars) : null;
            if (notes !== undefined) extraction.notes = notes;

            const result = await this.extractionRepository.save(extraction);
            response.json(result);
        } catch (error) {
            console.error('Error updating shot extraction:', error);
            response.status(500).json({ message: 'Error updating shot extraction' });
        }
    }

    async remove(request: Request, response: Response) {
        try {
            const extraction = await this.extractionRepository.findOne({
                where: { shot_id: request.params.id } as FindOptionsWhere<ShotExtraction>
            });

            if (!extraction) {
                return response.status(404).json({ message: 'Shot extraction not found' });
            }

            await this.extractionRepository.remove(extraction);
            response.status(204).send();
        } catch (error) {
            console.error('Error deleting shot extraction:', error);
            response.status(500).json({ message: 'Error deleting shot extraction' });
        }
    }
}

export default new ShotExtractionController();