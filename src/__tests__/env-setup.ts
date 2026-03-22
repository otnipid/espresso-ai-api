// Load test environment variables
import dotenv from 'dotenv';

// Set test environment first
process.env.NODE_ENV = 'test';

// Load environment variables (will use .env by default)
dotenv.config();

// Override test-specific values
process.env.LOG_LEVEL = 'error';
process.env.JWT_SECRET = 'test-secret-key';

console.log('✅ Test environment configured');
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  DB_HOST: ${process.env.DB_HOST}`);
console.log(`  DB_PORT: ${process.env.DB_PORT}`);
console.log(`  DB_NAME: ${process.env.DB_NAME}`);
