const request = require("supertest");
const app = require("../src/app");
const pool = require("../src/config/db");
const bcrypt = require("bcryptjs");

let token;

describe("Auth Flow", () => {
  const testUser = {
    email: "testuser@mail.com",
    password: "123456",
  };

  const hashedPassword = bcrypt.hashSync(testUser.password, 10);

  // ─── REGISTRATION ──────────────────────────────────────────────────
  describe("Registration", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app).post("/api/v1/users").send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.email).toBe(testUser.email);
    });

    it("should fail to register if email already exists", async () => {
      // Pre-seed user
      await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', 
        [testUser.email, hashedPassword, 'member']);

      const res = await request(app).post("/api/v1/users").send(testUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already in use/i);
    });

    it("should fail to register with invalid email", async () => {
      const res = await request(app).post("/api/v1/users").send({
        email: "invalid-email",
        password: "password123",
      });

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── LOGIN ─────────────────────────────────────────────────────────
  describe("Login", () => {
    it("should login and return token for valid credentials", async () => {
      // Pre-seed user
      await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', 
        [testUser.email, hashedPassword, 'member']);

      const res = await request(app).post("/api/v1/auth/login").send(testUser);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.token).toBeDefined();

      token = res.body.data.token; 
    });

    it("should fail login with incorrect password", async () => {
      // Pre-seed user
      await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', 
        [testUser.email, hashedPassword, 'member']);

      const res = await request(app).post("/api/v1/auth/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it("should fail login with non-existent email", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "nobody@mail.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(401);
    });
  });

  // ─── PROTECTED ROUTES ──────────────────────────────────────────────
  describe("Protected Routes", () => {
    it("should access protected route with valid token", async () => {
      // Ensure user exists and get token
      await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', 
        [testUser.email, hashedPassword, 'member']);
      
      const loginRes = await request(app).post("/api/v1/auth/login").send(testUser);
      token = loginRes.body.data.token;

      const res = await request(app)
        .get("/api/v1/tasks")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });

    it("should block access to protected route without token", async () => {
      const res = await request(app).get("/api/v1/tasks");

      expect(res.statusCode).toBe(401);
    });

    it("should block access with invalid token", async () => {
      const res = await request(app)
        .get("/api/v1/tasks")
        .set("Authorization", "Bearer invalidtoken123");

      expect(res.statusCode).toBe(401);
    });
  });
});