const globalErrorHandler = require('../../../src/middlewares/error.middleware");
const AppError = require('../../../src/utils/appError");

describe("Error Handling Units", () => {
    let req, res, next;

    beforeEach(() => {
        req = { requestId: "test-id" };
        res = { 
            status: jest.fn().mockReturnThis(), 
            json: jest.fn().mockReturnThis() 
        };
        next = jest.fn();
    });

    it("should handle 500 status in AppError", () => {
        const err = new AppError("Internal", 500);
        expect(err.status).toBe("error");
    });

    it("should handle operational errors in production environment", () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";
        
        const err = new AppError("Trusted Error", 400);
        err.isOperational = true;

        globalErrorHandler(err, req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: "fail",
            message: "Trusted Error"
        }));

        process.env.NODE_ENV = originalEnv;
    });

    it("should hide non-operational errors in production", () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "production";
        
        const err = new Error("Secret Database Error");

        globalErrorHandler(err, req, res, next);
        
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: "Something went very wrong!"
        }));

        process.env.NODE_ENV = originalEnv;
    });

    it("should include stack trace in development", () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = "development";
        
        const err = new AppError("Dev Error", 401);
        globalErrorHandler(err, req, res, next);
        
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            stack: expect.any(String)
        }));

        process.env.NODE_ENV = originalEnv;
    });
});
