import { BeanBatchService } from '../../../services/BeanBatchService';
import { BeanBatch } from '../../../entities/BeanBatch';
import { Bean } from '../../../entities/Bean';
import { DataSource } from 'typeorm';
import { createMockDataSource } from '../../__mocks__/data-source.mock';

// Mock data
const mockBeanData = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Test Bean',
  roaster: 'Test Roaster',
};

const mockBeanBatchData = {
  beanId: '550e8400-e29b-41d4-a716-446655440001',
  roastDate: '2024-01-15',
  bagOpenDate: '2024-01-20',
  roastLevel: 'Medium',
  roastDegree: 3,
};

describe('BeanBatchService', () => {
  let beanBatchService: BeanBatchService;
  let mockDataSource: DataSource;
  let mockBeanBatchRepository: any;
  let mockBeanRepository: any;

  beforeEach(() => {
    mockDataSource = createMockDataSource();
    
    // Setup mock repositories
    mockBeanBatchRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      findAndCount: jest.fn(),
    };
    
    mockBeanRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    
    mockDataSource.getRepository = jest.fn().mockImplementation((entity) => {
      if (entity === BeanBatch) return mockBeanBatchRepository;
      if (entity === Bean) return mockBeanRepository;
      return mockBeanBatchRepository;
    });
    
    beanBatchService = new BeanBatchService(mockDataSource);
  });

  describe('getAllBeanBatches', () => {
    it('should return all bean batches with relations', async () => {
      // Arrange
      const expectedBatches = [
        { 
          id: '1', 
          roastDate: new Date('2024-01-15'),
          bean: mockBeanData,
          shots: []
        },
        { 
          id: '2', 
          roastDate: new Date('2024-01-16'),
          bean: mockBeanData,
          shots: []
        },
      ];
      mockBeanBatchRepository.find.mockResolvedValue(expectedBatches);

      // Act
      const result = await beanBatchService.getAllBeanBatches();

      // Assert
      expect(mockBeanBatchRepository.find).toHaveBeenCalledWith({
        relations: ['bean', 'shots'],
      });
      expect(result).toEqual(expectedBatches);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockBeanBatchRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(beanBatchService.getAllBeanBatches()).rejects.toThrow('Database error');
    });
  });

  describe('getBeanBatchById', () => {
    it('should return bean batch by ID with relations', async () => {
      // Arrange
      const batchId = 'test-id';
      const expectedBatch = { 
        id: batchId, 
        roastDate: new Date('2024-01-15'),
        bean: mockBeanData,
        shots: []
      };
      mockBeanBatchRepository.findOne.mockResolvedValue(expectedBatch);

      // Act
      const result = await beanBatchService.getBeanBatchById(batchId);

      // Assert
      expect(mockBeanBatchRepository.findOne).toHaveBeenCalledWith({
        where: { id: batchId },
        relations: ['bean', 'shots'],
      });
      expect(result).toEqual(expectedBatch);
    });

    it('should throw error when bean batch not found', async () => {
      // Arrange
      const batchId = 'non-existent-id';
      mockBeanBatchRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(beanBatchService.getBeanBatchById(batchId)).rejects.toThrow(
        `Bean batch with ID ${batchId} not found`
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const batchId = 'test-id';
      const error = new Error('Database error');
      mockBeanBatchRepository.findOne.mockRejectedValue(error);

      // Act & Assert
      await expect(beanBatchService.getBeanBatchById(batchId)).rejects.toThrow('Database error');
    });
  });

  describe('createBeanBatch', () => {
    it('should create bean batch with valid data', async () => {
      // Arrange
      const mockBean = { id: mockBeanData.id, name: mockBeanData.name };
      const expectedBatch = { 
        id: 'new-id', 
        roastDate: new Date('2024-01-15'),
        bagOpenDate: new Date('2024-01-20'),
        roastLevel: 'Medium',
        roastDegree: 3,
        bean: mockBean
      };
      
      mockBeanRepository.findOne.mockResolvedValue(mockBean);
      mockBeanBatchRepository.create.mockReturnValue(mockBeanBatchData);
      mockBeanBatchRepository.save.mockResolvedValue(expectedBatch);

      // Act
      const result = await beanBatchService.createBeanBatch(mockBeanBatchData);

      // Assert
      expect(mockBeanRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockBeanData.id },
      });
      expect(mockBeanBatchRepository.create).toHaveBeenCalledWith({
        bean: mockBean,
        roastDate: new Date('2024-01-15'),
        bagOpenDate: new Date('2024-01-20'),
        roastLevel: 'Medium',
        roastDegree: 3,
      });
      expect(mockBeanBatchRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expectedBatch);
    });

    it('should throw error when beanId is missing', async () => {
      // Arrange
      const invalidData = {
        beanId: '', // Empty string should trigger validation
        roastDate: '2024-01-15',
      };

      // Act & Assert
      await expect(beanBatchService.createBeanBatch(invalidData)).rejects.toThrow(
        'Bean ID is required'
      );
    });

    it('should throw error when roastDate is missing', async () => {
      // Arrange
      const invalidData = {
        beanId: '550e8400-e29b-41d4-a716-446655440001',
        roastDate: '', // Empty string should trigger validation
      };

      // Act & Assert
      await expect(beanBatchService.createBeanBatch(invalidData)).rejects.toThrow(
        'Roast date is required'
      );
    });

    it('should throw error when bean not found', async () => {
      // Arrange
      mockBeanRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(beanBatchService.createBeanBatch(mockBeanBatchData)).rejects.toThrow(
        `Bean with ID ${mockBeanData.id} not found`
      );
    });

    it('should handle date string conversion', async () => {
      // Arrange
      const mockBean = { id: mockBeanData.id, name: mockBeanData.name };
      const batchDataWithDateStrings = {
        ...mockBeanBatchData,
        roastDate: '2024-01-15T00:00:00.000Z',
        bagOpenDate: '2024-01-20T00:00:00.000Z',
      };
      
      mockBeanRepository.findOne.mockResolvedValue(mockBean);
      mockBeanBatchRepository.create.mockReturnValue(batchDataWithDateStrings);
      mockBeanBatchRepository.save.mockResolvedValue({ id: 'new-id', ...batchDataWithDateStrings });

      // Act
      const result = await beanBatchService.createBeanBatch(batchDataWithDateStrings);

      // Assert
      expect(mockBeanBatchRepository.create).toHaveBeenCalledWith({
        bean: mockBean,
        roastDate: new Date('2024-01-15T00:00:00.000Z'),
        bagOpenDate: new Date('2024-01-20T00:00:00.000Z'),
        roastLevel: 'Medium',
        roastDegree: 3,
      });
      expect(result).toBeDefined();
    });

    it('should handle repository errors during creation', async () => {
      // Arrange
      const error = new Error('Database error');
      const mockBean = { id: mockBeanData.id, name: mockBeanData.name };
      mockBeanRepository.findOne.mockResolvedValue(mockBean);
      mockBeanBatchRepository.create.mockReturnValue(mockBeanBatchData);
      mockBeanBatchRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(beanBatchService.createBeanBatch(mockBeanBatchData)).rejects.toThrow('Database error');
    });
  });

  describe('updateBeanBatch', () => {
    it('should update existing bean batch', async () => {
      // Arrange
      const batchId = 'test-id';
      const existingBatch = {
        id: batchId,
        roastDate: new Date('2024-01-15'),
        bagOpenDate: new Date('2024-01-20'),
        roastLevel: 'Medium',
        roastDegree: 3,
      };
      const updateData = {
        roastLevel: 'Dark',
        roastDegree: 4,
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

    it('should throw error when bean batch not found for update', async () => {
      // Arrange
      const batchId = 'non-existent-id';
      const updateData = { roastLevel: 'Dark' };
      mockBeanBatchRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(beanBatchService.updateBeanBatch(batchId, updateData)).rejects.toThrow(
        `Bean batch with ID ${batchId} not found`
      );
    });

    it('should handle partial updates correctly', async () => {
      // Arrange
      const batchId = 'test-id';
      const existingBatch = {
        id: batchId,
        roastDate: new Date('2024-01-15'),
        bagOpenDate: new Date('2024-01-20'),
        roastLevel: 'Medium',
        roastDegree: 3,
      };
      const partialUpdate = { roastLevel: 'Light' }; // Only updating roast level
      const updatedBatch = { ...existingBatch, roastLevel: 'Light' };
      
      mockBeanBatchRepository.findOne.mockResolvedValue(existingBatch);
      mockBeanBatchRepository.save.mockResolvedValue(updatedBatch);

      // Act
      const result = await beanBatchService.updateBeanBatch(batchId, partialUpdate);

      // Assert
      expect(result.roastLevel).toBe('Light');
      expect(result.roastDegree).toBe(3); // Should remain unchanged
      expect(result.bagOpenDate).toEqual(existingBatch.bagOpenDate); // Should remain unchanged
    });

    it('should handle repository errors during update', async () => {
      // Arrange
      const batchId = 'test-id';
      const updateData = { roastLevel: 'Dark' };
      const error = new Error('Database error');
      mockBeanBatchRepository.findOne.mockResolvedValue({ id: batchId });
      mockBeanBatchRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(beanBatchService.updateBeanBatch(batchId, updateData)).rejects.toThrow('Database error');
    });
  });

  describe('deleteBeanBatch', () => {
    it('should delete existing bean batch', async () => {
      // Arrange
      const batchId = 'test-id';
      const existingBatch = { 
        id: batchId, 
        roastDate: new Date('2024-01-15'),
        bean: mockBeanData
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

    it('should throw error when bean batch not found for deletion', async () => {
      // Arrange
      const batchId = 'non-existent-id';
      mockBeanBatchRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(beanBatchService.deleteBeanBatch(batchId)).rejects.toThrow(
        `Bean batch with ID ${batchId} not found`
      );
    });

    it('should handle repository errors during deletion', async () => {
      // Arrange
      const batchId = 'test-id';
      const error = new Error('Database error');
      mockBeanBatchRepository.findOne.mockResolvedValue({ id: batchId });
      mockBeanBatchRepository.remove.mockRejectedValue(error);

      // Act & Assert
      await expect(beanBatchService.deleteBeanBatch(batchId)).rejects.toThrow('Database error');
    });
  });

  describe('getBeanBatchesByBeanId', () => {
    it('should return bean batches for specific bean', async () => {
      // Arrange
      const beanId = '550e8400-e29b-41d4-a716-446655440001';
      const expectedBatches = [
        { 
          id: '1', 
          roastDate: new Date('2024-01-15'),
          bean: mockBeanData,
          shots: []
        },
        { 
          id: '2', 
          roastDate: new Date('2024-01-16'),
          bean: mockBeanData,
          shots: []
        },
      ];
      mockBeanBatchRepository.find.mockResolvedValue(expectedBatches);

      // Act
      const result = await beanBatchService.getBeanBatchesByBeanId(beanId);

      // Assert
      expect(mockBeanBatchRepository.find).toHaveBeenCalledWith({
        where: { bean: { id: beanId } },
        relations: ['bean', 'shots'],
      });
      expect(result).toEqual(expectedBatches);
    });

    it('should return empty array when no batches found for bean', async () => {
      // Arrange
      const beanId = '550e8400-e29b-41d4-a716-446655440999';
      mockBeanBatchRepository.find.mockResolvedValue([]);

      // Act
      const result = await beanBatchService.getBeanBatchesByBeanId(beanId);

      // Assert
      expect(result).toEqual([]);
      expect(mockBeanBatchRepository.find).toHaveBeenCalledWith({
        where: { bean: { id: beanId } },
        relations: ['bean', 'shots'],
      });
    });

    it('should handle repository errors when fetching by bean ID', async () => {
      // Arrange
      const beanId = 'test-bean-id';
      const error = new Error('Database error');
      mockBeanBatchRepository.find.mockRejectedValue(error);

      // Act & Assert
      await expect(beanBatchService.getBeanBatchesByBeanId(beanId)).rejects.toThrow('Database error');
    });
  });
});
