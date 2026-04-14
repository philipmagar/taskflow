jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  execute: jest.fn(),
  getConnection: jest.fn(),
}));

const pool = require('../src/config/db');

// Setup default behaviors for mock
beforeEach(() => {
  pool.query.mockReset();
  
  // Default for findByEmail (return null/undefined for "not found")
  pool.query.mockResolvedValue([[]]); 
});
