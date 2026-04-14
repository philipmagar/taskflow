module.exports = {
  testEnvironment: "node",
  rootDir: "../../",
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 20000,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
};
