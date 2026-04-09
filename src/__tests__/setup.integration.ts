import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { BeanBatch } from '../entities/BeanBatch';
import { Machine } from '../entities/Machine';
import { Shot } from '../entities/Shot';
import { ShotPreparation } from '../entities/ShotPreparation';
import { ShotExtraction } from '../entities/ShotExtraction';
import { ShotEnvironment } from '../entities/shotEnvironment';
import { ShotFeedback } from '../entities/shotFeedback';
import { User } from '../entities/User';
import { Grinder } from '../entities/Grinder';

// Interface for what setupTestDatabase will return
export interface TestDatabase {
  dataSource: DataSource; // Test should use this DataSource
  container: StartedPostgreSqlContainer; // Reference to the container
  cleanup: () => Promise<void>; // Function to cleanup DataSource
}

// Manages the PostgreSQL container lifecycle for tests
export class PostgresContainerManager {
  private static instance: PostgresContainerManager | null = null;
  private container: StartedPostgreSqlContainer | null = null;
  private snapshotName = 'clean-db-snapshot'; // Name for our baseline snapshot

  // Singleton pattern to potentially share container across test suites (though we scope it per-file here)
  private constructor() {}

  public static getInstance(): PostgresContainerManager {
    if (!PostgresContainerManager.instance) {
      PostgresContainerManager.instance = new PostgresContainerManager();
    }
    return PostgresContainerManager.instance;
  }

  // Starts container, runs migrations *in* the container DB, takes snapshot
  async initialize(): Promise<void> {
    if (this.container) {
      console.log('Container already initialized.');
      return;
    }

    console.log('Starting PostgreSQL container...');

    try {
      this.container = await new PostgreSqlContainer('postgres:15')
        .withDatabase('espresso_ml')
        .withUsername(process.env.DB_USERNAME || 'postgres')
        .withPassword(process.env.DB_PASSWORD || 'postgres')
        .withExposedPorts(5432)
        .withStartupTimeout(120000) // 2 minutes startup timeout
        .start();
    } catch (error) {
      console.error('Failed to start PostgreSQL container:', error);
      throw error;
    }

    console.log(`Container started on port ${this.container.getMappedPort(5432)}`);

    // Create a DataSource to run migrations/synchronization
    const migrationDataSource = new DataSource({
      type: 'postgres',
      host: this.container.getHost(),
      port: this.container.getMappedPort(5432),
      username: 'postgres',
      password: 'postgres',
      database: 'espresso_ml',
      entities: [
        BeanBatch,
        Machine,
        Shot,
        ShotPreparation,
        ShotExtraction,
        ShotEnvironment,
        ShotFeedback,
        User,
        Grinder,
      ],
      synchronize: true, // Use synchronize for test setup since schemas are pre-loaded in Docker image
      logging: false,
    });

    try {
      console.log('Initializing database schema...');
      await migrationDataSource.initialize();
      console.log('Database schema initialized.');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error; // Fail fast if initialization doesn't work
    } finally {
      if (migrationDataSource.isInitialized) {
        await migrationDataSource.destroy();
      }
    }

    // Take a snapshot of the database state *after* migrations
    console.log(`Taking snapshot '${this.snapshotName}'...`);
    await this.container.snapshot(this.snapshotName);
    console.log('Snapshot taken.');
  }

  // Restores the 'clean' snapshot and provides a DataSource
  async setupTestDatabase(): Promise<TestDatabase> {
    if (!this.container) {
      throw new Error('Container not initialized. Call initialize() first.');
    }

    try {
      // Restore the database to the state captured in the snapshot
      console.log(`Restoring snapshot '${this.snapshotName}'...`);
      await this.container.restoreSnapshot(this.snapshotName);
      console.log('Snapshot restored.');

      // Create a *new DataSource* connecting to the restored database for this test
      const testDataSource = new DataSource({
        type: 'postgres',
        host: this.container.getHost(),
        port: this.container.getMappedPort(5432),
        username: 'postgres',
        password: 'postgres',
        database: 'espresso_ml',
        entities: [
          BeanBatch,
          Machine,
          Shot,
          ShotPreparation,
          ShotExtraction,
          ShotEnvironment,
          ShotFeedback,
          User,
          Grinder,
        ],
        synchronize: false, // Schema is already there from snapshot
        logging: false,
      });

      await testDataSource.initialize();

      // Cleanup function specific to this test's DataSource
      const cleanup = async () => {
        try {
          if (testDataSource.isInitialized) {
            await testDataSource.destroy();
          }
        } catch (error) {
          console.error('Error during test DB cleanup:', error);
        }
      };

      return {
        dataSource: testDataSource, // Provide the DataSource to the test
        container: this.container,
        cleanup,
      };
    } catch (error) {
      console.error('Error setting up test database:', error);
      throw error;
    }
  }

  // Stops and removes the container
  async teardown(): Promise<void> {
    if (this.container) {
      console.log('Stopping PostgreSQL container...');
      await this.container.stop();
      this.container = null;
      console.log('Container stopped.');
    }
    PostgresContainerManager.instance = null; // Reset singleton state
  }
}
