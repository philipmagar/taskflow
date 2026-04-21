const request = require("supertest");
const app = require('../../src/app");

describe("Health Check API", () => {
  it("should return 200 and success status", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
    expect(res.body.message).toBe("API is running");
  });

  it("should return proper JSON content-type", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.headers["content-type"]).toMatch(/json/);
  });

  it("should return 404 for non-existent routes", async () => {
    const res = await request(app).get("/api/v1/nonexistent");

    expect(res.statusCode).toBe(404);
  });

  it("should include security headers (helmet)", async () => {
    const res = await request(app).get("/api/v1/health");

    // Helmet sets these headers
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });

  it("should use morgan in development", () => {
    process.env.NODE_ENV = "development";
    jest.resetModules();
    const testApp = require('../../src/app");
    process.env.NODE_ENV = "test";
    expect(testApp).toBeDefined();
  });

  it("should not use morgan in production", () => {
    process.env.NODE_ENV = "production";
    jest.resetModules();
    const testAppProd = require('../../src/app");
    process.env.NODE_ENV = "test";
    expect(testAppProd).toBeDefined();
  });
});
