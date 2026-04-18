const validate = require('../src/middlewares/validate.middleware');

describe('Validate Middleware Units', () => {
    let req, res, next, mockSchema;

    beforeEach(() => {
        req = { body: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        mockSchema = {
            validate: jest.fn()
        };
    });

    it('should call next and set validatedBody on success', () => {
        const value = { title: 'Valid' };
        mockSchema.validate.mockReturnValue({ value });

        const middleware = validate(mockSchema);
        middleware(req, res, next);

        expect(req.validatedBody).toEqual(value);
        expect(next).toHaveBeenCalled();
    });

    it('should return 400 if validation fails', () => {
        const error = { details: [{ message: 'Title is required' }] };
        mockSchema.validate.mockReturnValue({ error });

        const middleware = validate(mockSchema);
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Title is required' });
        expect(next).not.toHaveBeenCalled();
    });
});
