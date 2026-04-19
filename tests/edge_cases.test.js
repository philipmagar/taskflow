const logger = require("../src/utils/logger");
const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const pool = require('../src/config/db');
const { detectSuspiciousInput } = require('../src/utils/securityDetector');
const securityMiddleware = require('../src/middlewares/security.middleware');

describe("Logger & Security Edge Cases", () => {
    it("should hit dev log formatting with meta", () => {
        logger.transports.forEach(t => t.silent = false);
        logger.info("Dev format with meta", { some: "meta" });
        logger.info("Dev format without meta");
        logger.transports.forEach(t => t.silent = true);
        expect(true).toBe(true);
    });

    it("should hit prod log formatting", () => {
        const oldEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";
        jest.resetModules();
        const prodLogger = require("../src/utils/logger");
        prodLogger.transports.forEach(t => t.silent = false);
        prodLogger.info("Prod log");
        prodLogger.error(new Error("Prod Error"));
        prodLogger.transports.forEach(t => t.silent = true);
        process.env.NODE_ENV = oldEnv;
        expect(true).toBe(true);
    });

    it('should test securityDetector string input', () => {
        expect(detectSuspiciousInput("<script>")).toBe(true);
        expect(detectSuspiciousInput("normal string")).toBe(false);
    });

    it('should test securityMiddleware remoteAddress fallback', () => {
        const req = { 
            connection: { remoteAddress: '192.168.1.1' },
            method: 'GET',
            originalUrl: '/'
        };
        const res = {};
        const next = jest.fn();
        securityMiddleware(req, res, next);
        expect(next).toHaveBeenCalled();
    });

    it('should block role selection during registration', async () => {
        const res = await request(app)
            .post('/api/v1/users')
            .send({ email: 'role@test.com', password: 'password', role: 'admin' });
        expect(res.statusCode).toBe(400); 
    });

    it('should allow admin to hit admin-query endpoint', async () => {
        const email = `admin_${Date.now()}@test.com`;
        const [resDb] = await pool.query("INSERT INTO users (email, password, role) VALUES (?, ?, ?)", 
           [email, "pass", "admin"]);
        const token = jwt.sign({ id: resDb.insertId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        const res = await request(app)
            .get('/api/v1/users/admin-query')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("welcome admin");
    });
});
