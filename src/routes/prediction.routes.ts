import { Router } from 'express';
import { PredictionController } from '../controllers/prediction.controller';

const router = Router();
const predictionController = new PredictionController();

// Parameter prediction endpoints
router.post(
  '/parameters/:shotId',
  predictionController.predictParameters.bind(predictionController)
);
router.post(
  '/parameters/from-data',
  predictionController.predictParametersFromData.bind(predictionController)
);

// Model information endpoints
router.get(
  '/feature-importance',
  predictionController.getFeatureImportance.bind(predictionController)
);
router.get('/model-metrics', predictionController.getModelMetrics.bind(predictionController));

// Feature management endpoints
router.post('/features/:shotId', predictionController.saveFeatures.bind(predictionController));

export default router;
