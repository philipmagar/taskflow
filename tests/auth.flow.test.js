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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── REGISTRATION ──────────────────────────────────────────────────
  describe("Registration", () => {
    it("should register a new user successfully", async () => {
      // 1. Mock findByEmail -> null (user doesn't exist)
      // 2. Mock create -> result with insertId
      pool.query
        .mockResolvedValueOnce([[]]) // findByEmail
        .mockResolvedValueOnce([{ insertId: 123 }]); // create

      const res = await request(app).post("/api/v1/users").send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.email).toBe(testUser.email);
    });

    it("should fail to register if email already exists", async () => {
      // Mock findByEmail -> returns a user object
      pool.query.mockResolvedValueOnce([[{ id: 1, email: testUser.email }]]);

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
      // Mock findByEmail -> returns user with hashed password
      pool.query.mockResolvedValue([
        [{ id: 1, email: testUser.email, password: hashedPassword, role: "member" }],
      ]);

      const res = await request(app).post("/api/v1/auth/login").send(testUser);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.token).toBeDefined();

      token = res.body.data.token; // save token for later
    });

    it("should fail login with incorrect password", async () => {
      // Mock findByEmail -> returns user
      pool.query.mockResolvedValue([
        [{ id: 1, email: testUser.email, password: hashedPassword }],
      ]);

      const res = await request(app).post("/api/v1/auth/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it("should fail login with non-existent email", async () => {
      // Mock findByEmail -> returns empty
      pool.query.mockResolvedValue([[]]);

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
      // Ensure we have a token
      if (!token) {
        pool.query.mockResolvedValue([
          [{ id: 1, email: testUser.email, password: hashedPassword, role: "member" }],
        ]);
        const loginRes = await request(app).post("/api/v1/auth/login").send(testUser);
        token = loginRes.body.data.token;
      }

      // Mock database call inside the controller that gets called after 'protect'
      // In TaskController.getTasks it likely calls a query
      pool.query.mockResolvedValue([[]]); // Return empty list of tasks

      const res = await request(app)
        .get("/api/v1/tasks")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
    });

    it("should block access to protected route without token", async () => {
      const res = await request(app).get("/api/v1/tasks");

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it("should block access with invalid token", async () => {
      const res = await request(app)
        .get("/api/v1/tasks")
        .set("Authorization", "Bearer invalidtoken123");

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/invalid token/i);
    });
  });
});