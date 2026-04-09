import { BeanBatchService } from '../../../services/BeanBatchService';
import { BeanBatch } from '../../../entities/BeanBatch';
import { DataSource } from 'typeorm';
import { createMockDataSource } from '../../__mocks__/data-source.mock';

describe('BeanBatchService', () => {
  let beanBatchService: BeanBatchService;
  let mockDataSource: DataSource;
  let mockBeanBatchRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repository
    mockBeanBatchRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(0),
    };

    // Create mock data source
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockBeanBatchRepository),
    } as any;

    beanBatchService = new BeanBatchService(mockDataSource);
  });

  describe('getAllBeanBatches', () => {
    it('should return all bean batches with relations', async () => {
      // Arrange
      const mockBatches = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Ethiopian Yirgacheffe',
          roaster: 'Blue Bottle',
          country: 'Ethiopia',
          roastDate: new Date('2023-01-01'),
          shots: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Colombian Supremo',
          roaster: 'Intelligentsia',
          country: 'Colombia',
          roastDate: new Date('2023-01-02'),
          shots: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockBeanBatchRepository.find.mockResolvedValue(mockBatches);

      // Act
      const result = await beanBatchService.getAllBeanBatches();

      // Assert
      expect(mockBeanBatchRepository.find).toHaveBeenCalledWith({
        relations: ['shots'],
      });
      expect(result).toEqual(mockBatches);
    });

    it('should handle database errors', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockBeanBatchRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(beanBatchService.getAllBeanBatches()).rejects.toThrow(
        'Error fetching bean batches: Database connection failed'
      );
    });
  });

  describe('getBeanBatchById', () => {
    it('should return bean batch when found', async () => {
      // Arrange
      const batchId = '550e8400-e29b-41d4-a716-446655440001';
      const mockBatch = {
        id: batchId,
        name: 'Ethiopian Yirgacheffe',
        roaster: 'Blue Bottle',
        country: 'Ethiopia',
        roastDate: new Date('2023-01-01'),
        shots: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBeanBatchRepository.findOne.mockResolvedValue(mockBatch);

      // Act
      const result = await beanBatchService.getBeanBatchById(batchId);

      // Assert
      expect(mockBeanBatchRepository.findOne).toHaveBeenCalledWith({
        where: { id: batchId },
        relations: ['shots'],
      });
      expect(result).toEqual(mockBatch);
    });

    it('should throw error when bean batch not found', async () => {
      // Arrange
      const batchId = '550e8400-e29b-41d4-a716-446655440999';
      mockBeanBatchRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(beanBatchService.getBeanBatchById(batchId)).rejects.toThrow(
        `Bean batch with ID ${batchId} not found`
      );
    });
  });

  describe('createBeanBatch', () => {
    it('should create bean batch successfully', async () => {
      // Arrange
      const batchData = {
        name: 'Ethiopian Yirgacheffe',
        roaster: 'Blue Bottle',
        country: 'Ethiopia',
        roastDate: '2023-01-01',
        bagOpenDate: '2023-06-01',
        roastLevel: 'Medium',
      };

      const createdBatch = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Ethiopian Yirgacheffe',
        roaster: 'Blue Bottle',
        country: 'Ethiopia',
        roastDate: new Date('2023-01-01'),
        bagOpenDate: new Date('2023-06-01'),
        roastLevel: 'Medium',
        roastDegree: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBeanBatchRepository.create.mockReturnValue(createdBatch);
      mockBeanBatchRepository.save.mockResolvedValue(createdBatch);

      // Act
      const result = await beanBatchService.createBeanBatch(batchData);

      // Assert
      expect(mockBeanBatchRepository.create).toHaveBeenCalledWith({
        name: 'Ethiopian Yirgacheffe',
        roaster: 'Blue Bottle',
        country: 'Ethiopia',
        roastDate: new Date('2023-01-01'),
        bagOpenDate: new Date('2023-06-01'),
        roastLevel: 'Medium',
      });
      expect(mockBeanBatchRepository.save).toHaveBeenCalledWith(createdBatch);
      expect(result).toEqual(createdBatch);
    });

    it('should throw error when name is missing', async () => {
      // Arrange
      const invalidData = { 
        name: '', 
        roastDate: '2023-01-01' 
      }; // Empty name

      // Act & Assert
      await expect(beanBatchService.createBeanBatch(invalidData)).rejects.toThrow(
        'Bean name is required'
      );
    });

    it('should throw error when roastDate is missing', async () => {
      // Arrange
      const invalidData = { 
        name: 'Ethiopian Yirgacheffe',
        roastDate: '' 
      }; // Empty roastDate

      // Act & Assert
      await expect(beanBatchService.createBeanBatch(invalidData)).rejects.toThrow(
        'Roast date is required'
      );
    });
  });

  describe('updateBeanBatch', () => {
    it('should update bean batch successfully', async () => {
      // Arrange
      const batchId = '550e8400-e29b-41d4-a716-446655440001';
      const existingBatch = {
        id: batchId,
        name: 'Ethiopian Yirgacheffe',
        roaster: 'Blue Bottle',
        country: 'Ethiopia',
        roastDate: new Date('2023-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        name: 'Ethiopian Yirgacheffe - Updated',
        roaster: 'Blue Bottle - Updated',
      };

      const updatedBatch = { ...existingBatch, ...updateData };

      mockBeanBatchRepository.findOne.mockResolvedValue(existingBatch);
      mockBeanBatchRepository.save.mockResolvedValue(updatedBatch);

      // Act
      const result = await beanBatchService.updateBeanBatch(batchId, updateData);

      // Assert
      expect(mockBeanBatchRepository.findOne).toHaveBeenCalledWith({
        where: { id: batchId },
      });
      expect(mockBeanBatchRepository.save).toHaveBeenCalledWith(updatedBatch);
      expect(result).toEqual(updatedBatch);
    });

    it('should throw error when bean batch not found', async () => {
      // Arrange
      const batchId = '550e8400-e29b-41d4-a716-446655440999';
      mockBeanBatchRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(beanBatchService.updateBeanBatch(batchId, {})).rejects.toThrow(
        `Bean batch with ID ${batchId} not found`
      );
    });
  });

  describe('deleteBeanBatch', () => {
    it('should delete bean batch successfully', async () => {
      // Arrange
      const batchId = '550e8400-e29b-41d4-a716-446655440001';
      const existingBatch = {
        id: batchId,
        name: 'Ethiopian Yirgacheffe',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBeanBatchRepository.findOne.mockResolvedValue(existingBatch);
      mockBeanBatchRepository.remove.mockResolvedValue(existingBatch);

      // Act
      const result = await beanBatchService.deleteBeanBatch(batchId);

      // Assert
      expect(mockBeanBatchRepository.findOne).toHaveBeenCalledWith({
        where: { id: batchId },
      });
      expect(mockBeanBatchRepository.remove).toHaveBeenCalledWith(existingBatch);
      expect(result).toBe(true);
    });

    it('should throw error when bean batch not found', async () => {
      // Arrange
      const batchId = '550e8400-e29b-41d4-a716-446655440999';
      mockBeanBatchRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(beanBatchService.deleteBeanBatch(batchId)).rejects.toThrow(
        `Bean batch with ID ${batchId} not found`
      );
    });
  });
});
