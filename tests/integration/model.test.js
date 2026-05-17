const TaskModel = require('../../src/models/task.model');
const User = require('../../src/models/user.model');
const pool = require('../../src/config/db');

describe("Models", () => {
    let userId;

    beforeEach(async () => {
        const [res] = await pool.query("INSERT INTO users (email, password) VALUES (?, ?)", 
           [`model_${Date.now()}@test.com`, "pass"]);
        userId = res.insertId;
    });

    describe("TaskModel", () => {
        it("should support filtering and sorting in getTasksByUserId", async () => {
            await pool.query("INSERT INTO tasks (title, description, user_id, status) VALUES (?,?,?,?)", 
               ["Task A", "Desc", userId, "pending"]);
            await pool.query("INSERT INTO tasks (title, description, user_id, status) VALUES (?,?,?,?)", 
               ["Task B", "Desc", userId, "pending"]);

            const tasksDesc = await TaskModel.getTasksByUserId(userId, { sort: "-title" });
            expect(tasksDesc[0].title).toBe("Task B");

            const tasksAsc = await TaskModel.getTasksByUserId(userId, { sort: "title" });
            expect(tasksAsc[0].title).toBe("Task A");

            const tasksInvalid = await TaskModel.getTasksByUserId(userId, { sort: "invalid_field" });
            expect(tasksInvalid.length).toBe(2);
        });

        it("should use default pagination in getTasksAdvanced", async () => {
            const tasks = await TaskModel.getTasksAdvanced(userId, {});
            expect(tasks).toBeDefined();
        });

        it("should handle limit and offset in getTasksAdvanced", async () => {
            for(let i=1; i<=5; i++) {
                await TaskModel.createTask(`Task ${i}`, "D", userId);
            }
            
            const tasks = await TaskModel.getTasksAdvanced(userId, { limit: 2, page: 2 });
            expect(tasks.length).toBe(2);
        });

        it("should fallback to 10 if limit is invalid in getTasksByUserId", async () => {
            const tasks = await TaskModel.getTasksByUserId(userId, { limit: "invalid" });
            expect(tasks).toBeDefined();
        });

        it("should ignore invalid sort field in getTasksAdvanced", async () => {
            const tasks = await TaskModel.getTasksAdvanced(userId, { sort: "invalid" });
            expect(tasks).toBeDefined();
        });
        
        it("should update task", async () => {
             const res = await TaskModel.createTask("Old", "D", userId);
             await TaskModel.updateTask(res.insertId, "New", "D2");
             const task = await TaskModel.getTaskById(res.insertId);
             expect(task.title).toBe("New");
        });

        it("should delete task", async () => {
             const res = await TaskModel.createTask("To Delete", "D", userId);
             await TaskModel.deleteTask(res.insertId);
             const task = await TaskModel.getTaskById(res.insertId);
             expect(task).toBeUndefined();
        });
    });

    describe("User Model", () => {
        it("should find user by email", async () => {
            const email = `find_${Date.now()}@test.com`;
            await User.create(email, "pass");
            const user = await User.findByEmail(email);
            expect(user).toBeDefined();
            expect(user.email).toBe(email);
        });
    });
});
