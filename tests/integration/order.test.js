const request = require("supertest");
const app = require('../../src/app');
const pool = require('../../src/config/db');
const bcrypt = require("bcryptjs");

describe("Order API", () => {
    let token;
    let userId;
    let productId;

    beforeEach(async () => {
        // Setup user
        const hashedPassword = await bcrypt.hash("123456", 10);
        const [userResult] = await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', 
            ['orderuser@test.com', hashedPassword, 'member']);
        userId = userResult.insertId;
        
        const loginRes = await request(app).post("/api/v1/auth/login").send({
            email: 'orderuser@test.com',
            password: '123456'
        });
        token = loginRes.body.data.token;

        // Setup product
        const [productResult] = await pool.query('INSERT INTO products (name, stock) VALUES (?, ?)', 
            ['Test Product', 10]);
        productId = productResult.insertId;
    });

    describe("POST /api/v1/orders", () => {
        it("should create an order successfully", async () => {
            const res = await request(app)
                .post("/api/v1/orders")
                .set("Authorization", `Bearer ${token}`)
                .send({ productId, quantity: 2 });

            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe("success");
            expect(res.body.message).toMatch(/order created/i);

            // Verify stock deduction
            const [productRows] = await pool.query("SELECT stock FROM products WHERE id = ?", [productId]);
            expect(productRows[0].stock).toBe(8);
        });

        it("should fail if product not found", async () => {
            const res = await request(app)
                .post("/api/v1/orders")
                .set("Authorization", `Bearer ${token}`)
                .send({ productId: 9999, quantity: 1 });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toMatch(/product not found/i);
        });

        it("should fail if insufficient stock", async () => {
            const res = await request(app)
                .post("/api/v1/orders")
                .set("Authorization", `Bearer ${token}`)
                .send({ productId, quantity: 100 });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toMatch(/insufficient stock/i);
        });

        it("should fail if unauthorized", async () => {
            const res = await request(app)
                .post("/api/v1/orders")
                .send({ productId, quantity: 1 });

            expect(res.statusCode).toBe(401);
        });
        it("should fail if quantity is less than 1", async () => {
            const res = await request(app)
                .post("/api/v1/orders")
                .set("Authorization", `Bearer ${token}`)
                .send({ productId, quantity: 0 });

            expect(res.statusCode).toBe(400);
        });

        it("should fail if authorized but product does not exist", async () => {
            const res = await request(app)
                .post("/api/v1/orders")
                .set("Authorization", `Bearer ${token}`)
                .send({ productId: 99999, quantity: 1 });

            expect(res.statusCode).toBe(404);
        });
    });
});
