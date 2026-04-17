const request = require("supertest");
const app = require("../src/app");
const securityTrack = require("../src/utils/securityTrack");

describe("Auth API", () => {
  beforeEach(() => {
    securityTrack.resetAttempts("::ffff:127.0.0.1");
    securityTrack.resetAttempts("127.0.0.1");
    securityTrack.resetAttempts("::1");
  });


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
  describe("POST /api/v1/users", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app)
        .post("/api/v1/users")
        .send({
          email: "newuser@test.com",
          password: "password123",
        });

      if (res.statusCode !== 201) console.log('REG ERROR:', res.statusCode, res.body);
      expect(res.statusCode).toBe(201);
      expect(res.body.data.email).toBe("newuser@test.com");
    });

    it("should fail to register if email exists", async () => {
       await request(app).post("/api/v1/users").send({
          email: "duplicate@test.com",
          password: "password123",
       });

       const res = await request(app).post("/api/v1/users").send({
          email: "duplicate@test.com",
          password: "password123",
       });

       if (res.statusCode !== 400) console.log('DUP ERROR:', res.statusCode, res.body);
       expect(res.statusCode).toBe(400);
       expect(res.body.message).toMatch(/already in use/i);
    });
  });

  describe("Brute Force Protection", () => {
    it("should block login after too many failed attempts", async () => {
      // 5 attempts trigger blocking in securityTrack.js
      for (let i = 0; i < 5; i++) {
        await request(app).post("/api/v1/auth/login").send({
          email: "target@test.com",
          password: "wrong",
        });
      }

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "target@test.com",
        password: "wrong",
      });

      // securityMiddleware returns 403 for blocked IPs
      expect([400, 429, 403]).toContain(res.statusCode);
    });
  });
});