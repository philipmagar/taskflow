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

  describe("Task CRUD Ops (Integration)", () => {
    const pool = require("../src/config/db");
    const bcrypt = require("bcryptjs");
    let token;

    beforeEach(async () => {
      // Setup user for auth
      const hashedPassword = await bcrypt.hash( "123456", 10);
      await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', 
        ['taskuser@test.com', hashedPassword, 'member']);
      
      const res = await request(app).post("/api/v1/auth/login").send({
        email: 'taskuser@test.com',
        password: '123456'
      });
      token = res.body.data.token;
    });

    it("should create a task successfully", async () => {
      const res = await request(app)
        .post("/api/v1/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Integration Task", description: "Testing" });

      if (res.statusCode !== 201) {
        console.error('DEBUG CREATE ERROR:', JSON.stringify(res.body, null, 2));
      }
      expect(res.statusCode).toBe(201);
      expect(res.body.data.taskId).toBeDefined();
      
      // Verify in DB
      const [rows] = await pool.query("SELECT * FROM tasks WHERE title = ?", ["Integration Task"]);
      expect(rows.length).toBe(1);
    });

    it("should fetch user tasks", async () => {
       // Pre-seed a task (using subquery safely)
       const [[user]] = await pool.query("SELECT id FROM users LIMIT 1");
       await pool.query("INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)", 
        ["Sample Task", "Sample Desc", user.id]);

       const res = await request(app)
        .get("/api/v1/tasks")
        .set("Authorization", `Bearer ${token}`);

       if (res.statusCode !== 200) {
        console.error('DEBUG FETCH ERROR:', JSON.stringify(res.body, null, 2));
       }
       expect(res.statusCode).toBe(200);
       expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(1);
    });
    it("should fail to fetch task that does not exist", async () => {
      const res = await request(app)
        .get("/api/v1/tasks/9999")
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
    });

    it("should fail to fetch another user's task", async () => {
       // Create another user and their task
       const hashedPassword = await bcrypt.hash("123456", 10);
       const [otherUser] = await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', 
         ['other@test.com', hashedPassword, 'member']);
       const [otherTask] = await pool.query("INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)", 
         ["Other Task", "Secret", otherUser.insertId]);

       const res = await request(app)
        .get(`/api/v1/tasks/${otherTask.insertId}`)
        .set("Authorization", `Bearer ${token}`);

       expect(res.statusCode).toBe(404); // Access denied is 404 in this API
    });

    it("should fail to update another user's task", async () => {
       // Create another user and their task first
       const hashedPassword = await bcrypt.hash("123456", 10);
       const [otherUser] = await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', 
         ['other_update@test.com', hashedPassword, 'member']);
       const [otherTask] = await pool.query("INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)", 
         ["Other Task Update", "Secret", otherUser.insertId]);
       
       const res = await request(app)
        .patch(`/api/v1/tasks/${otherTask.insertId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Hack" });

       expect(res.statusCode).toBe(404);
    });

    it("should fail to delete another user's task", async () => {
       // Create another user and their task first
       const hashedPassword = await bcrypt.hash("123456", 10);
       const [otherUser] = await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', 
         ['other_delete@test.com', hashedPassword, 'member']);
       const [otherTask] = await pool.query("INSERT INTO tasks (title, description, user_id) VALUES (?, ?, ?)", 
         ["Other Task Delete", "Secret", otherUser.insertId]);

       const res = await request(app)
        .delete(`/api/v1/tasks/${otherTask.insertId}`)
        .set("Authorization", `Bearer ${token}`);

       expect(res.statusCode).toBe(404);
    });
  });
});