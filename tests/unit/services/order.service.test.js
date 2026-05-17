const orderService = require('../../../src/services/order.service');
const pool = require('../../../src/config/db');
const AppError = require('../../../src/utils/appError');

jest.mock('../../../src/config/db');

describe('Order Service Units', () => {
    let mockConnection;

    beforeEach(() => {
        mockConnection = {
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn(),
            query: jest.fn(),
        };
        pool.getConnection.mockResolvedValue(mockConnection);
        jest.clearAllMocks();
    });

    describe('createOrder', () => {
        it('should create an order successfully if stock is enough', async () => {
             // Mock SELECT FOR UPDATE
             mockConnection.query.mockResolvedValueOnce([[{ stock: 10 }]]);
             // Mock UPDATE products
             mockConnection.query.mockResolvedValueOnce([{}]);
             // Mock INSERT INTO orders
             mockConnection.query.mockResolvedValueOnce([{ insertId: 500 }]);

             const result = await orderService.createOrder(1, 101, 2);

             expect(result.insertId).toBe(500);
             expect(mockConnection.beginTransaction).toHaveBeenCalled();
             expect(mockConnection.commit).toHaveBeenCalled();
        });

        it('should fail if quantity < 1', async () => {
            await expect(orderService.createOrder(1, 101, 0))
                .rejects.toThrow('Quantity must be at least 1');
            expect(mockConnection.rollback).toHaveBeenCalled();
        });

        it('should fail if product not found', async () => {
            mockConnection.query.mockResolvedValueOnce([[]]);

            await expect(orderService.createOrder(1, 101, 1))
                .rejects.toThrow('Product not found');
        });

        it('should fail if insufficient stock', async () => {
            mockConnection.query.mockResolvedValueOnce([[{ stock: 5 }]]);

            await expect(orderService.createOrder(1, 101, 10))
                .rejects.toThrow('Insufficient stock');
        });

        it('should rollback on any other error', async () => {
            mockConnection.query.mockImplementation(() => { throw new Error('DB ERROR'); });

            await expect(orderService.createOrder(1, 101, 1))
                .rejects.toThrow('DB ERROR');
            expect(mockConnection.rollback).toHaveBeenCalled();
        });
    });
});
