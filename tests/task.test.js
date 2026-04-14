const request = require("supertest");
const app = require("../src/app");

describe("Task API", () => {

  describe("Authentication Guard", () => {

    it("should block GET /tasks without token (401)", async () => {
      const res = await request(app).get("/api/v1/tasks");

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe("fail");
    });

    it("should block POST /tasks without token (401)", async () => {
      const res = await request(app)
        .post("/api/v1/tasks")
        .send({ title: "Test Task", description: "Test" });

      expect(res.statusCode).toBe(401);
    });

    it("should block PATCH /tasks/:id without token (401)", async () => {
      const res = await request(app)
        .patch("/api/v1/tasks/1")
        .send({ title: "Updated Task" });

      expect(res.statusCode).toBe(401);
    });

    it("should block DELETE /tasks/:id without token (401)", async () => {
      const res = await request(app).delete("/api/v1/tasks/1");

      expect(res.statusCode).toBe(401);
    });
  });

  describe("Invalid Token", () => {

    it("should reject request with malformed token", async () => {
      const res = await request(app)
        .get("/api/v1/tasks")
        .set("Authorization", "Bearer invalid.token.here");

      expect(res.statusCode).toBe(401);
    });

    it("should reject request with expired/fake JWT", async () => {
      const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZXhwIjoxfQ.fake";
      const res = await request(app)
        .get("/api/v1/tasks")
        .set("Authorization", `Bearer ${fakeToken}`);

      expect(res.statusCode).toBe(401);
    });
  });
});