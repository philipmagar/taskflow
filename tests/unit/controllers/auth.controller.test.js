const authController = require('../../../src/controllers/auth.controller');
const User = require('../../../src/models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const securityTracker = require('../../../src/utils/securityTrack');
const apiResponse = require('../../../src/utils/apiResponse');
const AppError = require('../../../src/utils/appError');

jest.mock('../../../src/models/user.model');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../src/utils/securityTrack');
jest.mock('../../../src/utils/apiResponse');
jest.mock('../../../src/utils/logger');

describe('Auth Controller Units', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: { email: 'test@test.com', password: 'password' },
            ip: '127.0.0.1'
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
        
        process.env.JWT_SECRET = 'secret';
        process.env.JWT_EXPIRES_IN = '1h';
    });

    describe('login', () => {
        it('should fail if IP is blocked', async () => {
            securityTracker.isBlocked.mockReturnValue(true);

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(429);
        });

        it('should fail if user not found', async () => {
            securityTracker.isBlocked.mockReturnValue(false);
            User.findByEmail.mockResolvedValue(null);

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(401);
            expect(securityTracker.recordEvent).toHaveBeenCalledWith(req.ip);
        });

        it('should fail if password mismatch', async () => {
            securityTracker.isBlocked.mockReturnValue(false);
            User.findByEmail.mockResolvedValue({ id: 1, password: 'hashed' });
            bcrypt.compare.mockResolvedValue(false);

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(401);
            expect(securityTracker.recordEvent).toHaveBeenCalledWith(req.ip);
        });

        it('should login successfully if credentials are correct', async () => {
            securityTracker.isBlocked.mockReturnValue(false);
            const mockUser = { id: 1, email: 'test@test.com', role: 'member', password: 'hashed' };
            User.findByEmail.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mock-token');

            await authController.login(req, res, next);

            expect(securityTracker.resetAttempts).toHaveBeenCalledWith(req.ip);
            expect(jwt.sign).toHaveBeenCalled();
            expect(apiResponse.success).toHaveBeenCalledWith(res, 'Login successful', expect.objectContaining({
                token: 'mock-token',
                user: expect.objectContaining({ email: 'test@test.com' })
            }));
        });
    });
});
