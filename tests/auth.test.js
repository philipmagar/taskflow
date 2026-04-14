const request = require("supertest");
const app = require("../src/app");

describe("Auth API", () => {

  describe("POST /api/v1/auth/login", () => {

    it("should fail login with wrong credentials (401)", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "wrong@test.com",
          password: "123456",
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe("fail");
    });

    it("should fail login with missing email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          password: "123456",
        });

      // Should return 401 (invalid credentials) since no email provided
      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    it("should fail login with missing password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@test.com",
        });

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    it("should fail login with empty body", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({});

      expect(res.statusCode).toBeGreaterThanOrEqual(400);
    });

    it("should return JSON response format", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "wrong@test.com",
          password: "wrong",
        });

      expect(res.headers["content-type"]).toMatch(/json/);
      expect(res.body).toHaveProperty("status");
      expect(res.body).toHaveProperty("message");
    });
  });
});