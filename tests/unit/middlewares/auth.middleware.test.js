const { protect, restrictTo } = require('../../../src/middlewares/auth.middleware');
const jwt = require('jsonwebtoken');
const AppError = require('../../../src/utils/appError');

jest.mock('jsonwebtoken');

describe('Authorization Middleware Units', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('protect middleware', () => {
        it('should fail if no token is provided', () => {
            protect(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            const error = next.mock.calls[0][0];
            expect(error.statusCode).toBe(401);
            expect(error.message).toContain('not authorized');
        });

        it('should fail if token is malformed (no Bearer)', () => {
            req.headers.authorization = 'InvalidToken';
            protect(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(401);
        });

        it('should pass and set req.user if token is valid', () => {
            const mockUser = { id: 1, role: 'member' };
            req.headers.authorization = 'Bearer valid-token';
            jwt.verify.mockReturnValue(mockUser);

            protect(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalledWith();
        });

        it('should fail if jwt.verify throws error', () => {
            req.headers.authorization = 'Bearer bad-token';
            jwt.verify.mockImplementation(() => {
                throw new Error('JsonWebTokenError');
            });

            protect(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].message).toBe('Invalid token');
            expect(next.mock.calls[0][0].statusCode).toBe(401);
        });
    });

    describe('restrictTo middleware', () => {
        it('should allow user with required role', () => {
            req.user = { role: 'admin' };
            const middleware = restrictTo('admin', 'manager');
            
            middleware(req, res, next);

            expect(next).toHaveBeenCalledWith();
        });

        it('should block user without required role', () => {
            req.user = { role: 'member' };
            const middleware = restrictTo('admin');

            middleware(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(403);
            expect(next.mock.calls[0][0].message).toContain('not authorized');
        });
    });
});
