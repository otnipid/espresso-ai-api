import { DataSource } from 'typeorm';

export const createMockDataSource = (): jest.Mocked<DataSource> => {
  const mockDataSource = {
    getRepository: jest.fn(),
    initialize: jest.fn().mockResolvedValue(undefined),
    destroy: jest.fn().mockResolvedValue(undefined),
    isInitialized: false,
    manager: {
      connection: {
        createQueryRunner: jest.fn().mockReturnValue({
          connect: jest.fn().mockResolvedValue(undefined),
          startTransaction: jest.fn().mockResolvedValue(undefined),
          commitTransaction: jest.fn().mockResolvedValue(undefined),
          rollbackTransaction: jest.fn().mockResolvedValue(undefined),
          release: jest.fn().mockResolvedValue(undefined),
        }),
      },
    },
  } as any;

  return mockDataSource;
};
