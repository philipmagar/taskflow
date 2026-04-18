const bcrypt = require('bcryptjs');

/**
 * Factory for creating user objects for testing
 */
const userFactory = {
  /**
   * Generates a random user object
   */
  build: async (overrides = {}) => {
    const id = overrides.id || Math.floor(Math.random() * 1000);
    const password = overrides.password || "password123";
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return {
      id,
      email: overrides.email || `testuser_${id}@example.com`,
      password: hashedPassword,
      role: overrides.role || 'member',
      task_count: overrides.task_count || 0,
      ...overrides
    };
  }
};

module.exports = userFactory;
