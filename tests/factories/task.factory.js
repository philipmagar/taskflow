/**
 * Factory for creating task objects for testing
 */
const taskFactory = {
  build: (overrides = {}) => {
    const id = overrides.id || Math.floor(Math.random() * 1000);
    return {
      id,
      title: overrides.title || `Task ${id}`,
      description: overrides.description || `Description for task ${id}`,
      status: overrides.status || 'pending',
      user_id: overrides.user_id || 1,
      created_at: new Date(),
      ...overrides
    };
  }
};

module.exports = taskFactory;
