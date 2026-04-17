require('dotenv').config({ path: '.env.test' });
process.env.NODE_ENV = 'test';

module.exports = {
  testEnvironment: "node",
  rootDir: "../../",
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 20000,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/config/*.js",
    "!src/migrations/*.js"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "clover"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
