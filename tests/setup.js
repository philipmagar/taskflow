const pool = require('../src/config/db');
const logger = require('../src/utils/logger');

// Silence logger during tests
logger.transports.forEach((t) => (t.silent = true));


// DB cleaned before tests
beforeEach(async () => {
  // Disable FK checks to allow truncation
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  
  // Get all tables
  const [tables] = await pool.query("SHOW TABLES");
  const tableNames = tables.map(row => Object.values(row)[0]);

  // Truncate each table to ensure tests run independently
  for (const table of tableNames) {
    await pool.query(`TRUNCATE TABLE ${table}`);
  }

  // Re-enable FK checks
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');
});

afterAll(async () => {
  await pool.end();
});

