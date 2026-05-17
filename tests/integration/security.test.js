const request = require("supertest");
const app = require('../../src/app');
const securityTrack = require('../../src/utils/securityTrack');

// Reset security tracker state before each test to prevent cross-test contamination
beforeEach(() => {
  securityTrack.resetAttempts("::ffff:127.0.0.1");
  securityTrack.resetAttempts("127.0.0.1");
  securityTrack.resetAttempts("::1");
});

describe("Security Testing", () => {

  // ─── XSS Protection ───────────────────────────────────────────────
  describe("XSS Protection", () => {

    it("should block <script> tags in request body", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "<script>alert('xss')</script>",
          password: "password123",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe("fail");
      expect(res.body.message).toMatch(/suspicious/i);
    });

    it("should block <script> tags in query parameters", async () => {
      const res = await request(app)
        .get("/api/v1/health?search=<script>alert('xss')</script>");

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/suspicious/i);
    });
  });

  // ─── SQL Injection Protection ─────────────────────────────────────
  describe("SQL Injection Protection", () => {

    it("should block SELECT...FROM in request body", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "SELECT * FROM users",
          password: "test",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/suspicious/i);
    });

    it("should block DROP TABLE in request body", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "test@test.com; DROP TABLE users;",
          password: "test",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/suspicious/i);
    });

    it("should block OR 1=1 injection in request body", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "admin' OR 1=1 --",
          password: "test",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/suspicious/i);
    });

    it("should block INSERT INTO in request body", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "INSERT INTO users VALUES('hacker','pass')",
          password: "test",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/suspicious/i);
    });
  });

  // ─── Security Headers (Helmet) ────────────────────────────────────
  describe("Security Headers", () => {

    it("should set X-Content-Type-Options header", async () => {
      const res = await request(app).get("/api/v1/health");
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });

    it("should set X-Frame-Options header", async () => {
      const res = await request(app).get("/api/v1/health");
      expect(res.headers["x-frame-options"]).toBeDefined();
    });

    it("should set Content-Security-Policy header", async () => {
      const res = await request(app).get("/api/v1/health");
      expect(res.headers["content-security-policy"]).toBeDefined();
    });

    it("should not expose X-Powered-By header", async () => {
      const res = await request(app).get("/api/v1/health");
      expect(res.headers["x-powered-by"]).toBeUndefined();
    });
  });

  // ─── Brute Force / IP Blocking ────────────────────────────────────
  describe("Brute Force Protection (securityTrack)", () => {

    it("should allow clean requests initially", async () => {
      const res = await request(app).get("/api/v1/health");
      expect(res.statusCode).toBe(200);
    });

    it("isBlocked should return false for clean IPs", () => {
      expect(securityTrack.isBlocked("192.168.1.1")).toBe(false);
    });

    it("recordEvent should increment attempt count", () => {
      const count1 = securityTrack.recordEvent("10.0.0.1");
      const count2 = securityTrack.recordEvent("10.0.0.1");

      expect(count1).toBe(1);
      expect(count2).toBe(2);

      // Clean up
      securityTrack.resetAttempts("10.0.0.1");
    });

    it("should block IP after 5 suspicious attempts", () => {
      const testIP = "10.0.0.99";

      for (let i = 0; i < 5; i++) {
        securityTrack.recordEvent(testIP);
      }

      expect(securityTrack.isBlocked(testIP)).toBe(true);

      // Clean up
      securityTrack.resetAttempts(testIP);
    });

    it("resetAttempts should unblock an IP", () => {
      const testIP = "10.0.0.100";

      // Block the IP
      for (let i = 0; i < 5; i++) {
        securityTrack.recordEvent(testIP);
      }
      expect(securityTrack.isBlocked(testIP)).toBe(true);

      // Reset and verify unblocked
      securityTrack.resetAttempts(testIP);
      expect(securityTrack.isBlocked(testIP)).toBe(false);
    });
  });

  // ─── HPP (HTTP Parameter Pollution) ───────────────────────────────
  describe("HTTP Parameter Pollution Protection", () => {

    it("should handle duplicate query parameters safely", async () => {
      const res = await request(app)
        .get("/api/v1/health?test=1&test=2");

      // HPP should not crash the server — request should still succeed
      expect(res.statusCode).toBe(200);
    });
  });

  // ─── Safe Input Passthrough ───────────────────────────────────────
  describe("Safe Input Passthrough", () => {

    it("should allow normal login requests through", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "user@example.com",
          password: "normalpassword123",
        });

      // Should reach the auth controller (401 = credentials wrong, not blocked)
      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe("fail");
    });

    it("should allow normal query parameters through", async () => {
      const res = await request(app)
        .get("/api/v1/health?version=1");

      expect(res.statusCode).toBe(200);
    });
  });
});
