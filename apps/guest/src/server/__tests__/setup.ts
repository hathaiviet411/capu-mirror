import { vi } from 'vitest';

// Global test setup
beforeEach(() => {
  // Clear all mocks between tests
  vi.clearAllMocks();
});

// Mock environment variables for tests
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NODE_ENV = 'test';