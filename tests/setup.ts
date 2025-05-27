import dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost/test';

// Mock console.log during tests to reduce noise
const originalLog = console.log;
console.log = (...args: any[]) => {
  if (!args[0]?.includes('[express]')) {
    originalLog(...args);
  }
};