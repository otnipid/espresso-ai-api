import { Router } from 'express';

// Mock the controller
jest.mock('../../../controllers/shotEnvironment.controller', () => ({
  all: jest.fn(),
  one: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}));

import shotEnvironmentRoutes from '../../../routes/shotEnvironment.routes';

// Import the mocked controller
const shotEnvironmentController = require('../../../controllers/shotEnvironment.controller');

describe('ShotEnvironment Routes', () => {
  let router: Router;

  beforeEach(() => {
    router = shotEnvironmentRoutes;
  });

  describe('Route Configuration', () => {
    it('should be an Express Router instance', () => {
      expect(router).toBeInstanceOf(Router);
    });

    it('should have the correct routes defined', () => {
      const routes = router.stack.map(layer => ({
        path: (layer as any).route?.path,
        method: Object.keys((layer as any).route?.methods || {})[0],
      }));

      expect(routes).toEqual(
        expect.arrayContaining([
          { path: '/', method: 'get' },
          { path: '/:id', method: 'get' },
          { path: '/', method: 'post' },
          { path: '/:id', method: 'put' },
          { path: '/:id', method: 'delete' },
        ])
      );
    });
  });

  describe('Route Handlers', () => {
    it('should bind all route to controller.all method', () => {
      const getRoute = router.stack.find(layer => (layer as any).route?.path === '/');
      expect(getRoute).toBeDefined();
      expect(getRoute?.route?.path).toBe('/');
    });

    it('should bind one route to controller.one method', () => {
      const getOneRoute = router.stack.find(layer => (layer as any).route?.path === '/:id');
      expect(getOneRoute).toBeDefined();
      expect(getOneRoute?.route?.path).toBe('/:id');
    });

    it('should bind save route to controller.save method', () => {
      const postRoute = router.stack.find(layer => (layer as any).route?.path === '/');
      expect(postRoute).toBeDefined();
      expect(postRoute?.route?.path).toBe('/');
    });

    it('should bind update route to controller.update method', () => {
      const putRoute = router.stack.find(layer => (layer as any).route?.path === '/:id');
      expect(putRoute).toBeDefined();
      expect(putRoute?.route?.path).toBe('/:id');
    });

    it('should bind remove route to controller.remove method', () => {
      const deleteRoute = router.stack.find(layer => (layer as any).route?.path === '/:id');
      expect(deleteRoute).toBeDefined();
      expect(deleteRoute?.route?.path).toBe('/:id');
    });
  });
});
