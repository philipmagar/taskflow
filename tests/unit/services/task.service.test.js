const taskService = require('../../../src/services/task.service');
const pool = require('../../../src/config/db');
const cache = require('../../../src/utils/cache');
const TaskModel = require('../../../src/models/task.model');
const AppError = require('../../../src/utils/appError');

jest.mock('../../../src/config/db');
jest.mock('../../../src/utils/cache');
jest.mock('../../../src/models/task.model');

describe('Task Service Business Logic Units', () => {
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

    describe('createTask', () => {
        it('should create a task and update user task count atomically', async () => {
            const userId = 1;
            const title = 'Test Task';
            const description = 'Test Desc';

            mockConnection.query.mockResolvedValueOnce([[{ task_count: 5 }]]); 
            mockConnection.query.mockResolvedValueOnce([{ insertId: 101 }]); 
            mockConnection.query.mockResolvedValueOnce([{}]); 

            const result = await taskService.createTask(title, description, userId);

            expect(mockConnection.beginTransaction).toHaveBeenCalled();
            expect(mockConnection.commit).toHaveBeenCalled();
            expect(cache.deleteByPrefix).toHaveBeenCalledWith(`tasks:user:${userId}`);
            expect(result).toEqual({ insertId: 101 });
        });

        it('should throw error if title is missing', async () => {
            await expect(taskService.createTask('', 'Desc', 1))
                .rejects.toThrow(AppError);
        });

        it('should rollback if user not found', async () => {
            mockConnection.query.mockResolvedValueOnce([[]]); 

            await expect(taskService.createTask('Title', 'Desc', 1))
                .rejects.toThrow(AppError);
            
            expect(mockConnection.rollback).toHaveBeenCalled();
        });
    });

    describe('getTaskById', () => {
        it('should return task if user owns it', async () => {
            const task = { id: 10, user_id: 1, title: 'Own' };
            TaskModel.getTaskById.mockResolvedValue(task);
            const result = await taskService.getTaskById(10, 1);
            expect(result).toEqual(task);
        });

        it('should throw error if task not found', async () => {
            TaskModel.getTaskById.mockResolvedValue(null);
            await expect(taskService.getTaskById(10, 1)).rejects.toThrow(AppError);
        });

        it('should throw error if user does not own task', async () => {
            const task = { id: 10, user_id: 2, title: 'Not Mine' };
            TaskModel.getTaskById.mockResolvedValue(task);
            await expect(taskService.getTaskById(10, 1)).rejects.toThrow(AppError);
        });
    });

    describe('getTasks', () => {
        it('should return cached data if available', async () => {
            const userId = 1;
            const queryParams = { status: 'pending' };
            const cachedTasks = [{ id: 1, title: 'Cached' }];
            cache.get.mockReturnValue(cachedTasks);

            const result = await taskService.getTasks(userId, queryParams);
            expect(result).toBe(cachedTasks);
        });

        it('should fetch from database and store in cache if miss', async () => {
            cache.get.mockReturnValue(null);
            TaskModel.getTasksAdvanced.mockResolvedValue([]);

            await taskService.getTasks(1, {});
            expect(cache.set).toHaveBeenCalled();
        });
    });

    describe('updateTask', () => {
        it('should update task if user owns it', async () => {
            const task = { id: 10, user_id: 1, title: 'Old' };
            TaskModel.getTaskById.mockResolvedValue(task);
            TaskModel.updateTask.mockResolvedValue({ affectedRows: 1 });

            await taskService.updateTask(10, 1, { title: 'New' });
            expect(TaskModel.updateTask).toHaveBeenCalled();
            expect(cache.deleteByPrefix).toHaveBeenCalled();
        });

        it('should fallback to old title and description if not provided', async () => {
            const task = { id: 10, user_id: 1, title: 'Old', description: 'OldD' };
            TaskModel.getTaskById.mockResolvedValue(task);
            TaskModel.updateTask.mockResolvedValue({ affectedRows: 1 });

            await taskService.updateTask(10, 1, {});
            expect(TaskModel.updateTask).toHaveBeenCalledWith(10, 'Old', 'OldD');
        });

        it('should throw error if user does not own task', async () => {
            const task = { id: 10, user_id: 2 };
            TaskModel.getTaskById.mockResolvedValue(task);
            await expect(taskService.updateTask(10, 1, { title: 'X' })).rejects.toThrow(AppError);
        });
    });

    describe('deleteTask', () => {
        it('should delete task and decrement user count', async () => {
            mockConnection.query.mockResolvedValueOnce([[{ task_count: 5 }]]);
            mockConnection.query.mockResolvedValueOnce([[{ id: 10, user_id: 1 }]]);
            mockConnection.query.mockResolvedValueOnce([{}]);
            mockConnection.query.mockResolvedValueOnce([{}]);

            const result = await taskService.deleteTask(10, 1);
            expect(result).toBe(true);
            expect(mockConnection.commit).toHaveBeenCalled();
        });

        it('should throw if user not found during delete', async () => {
            mockConnection.query.mockResolvedValueOnce([[]]);
            await expect(taskService.deleteTask(10, 1)).rejects.toThrow(AppError);
        });

        it('should fail if task does not belong to user during delete', async () => {
             mockConnection.query.mockResolvedValueOnce([[{ task_count: 5 }]]);
             mockConnection.query.mockResolvedValueOnce([[]]);
             await expect(taskService.deleteTask(10, 1)).rejects.toThrow(AppError);
        });
    });

    describe('getTasksByUserId', () => {
        it('should call TaskModel.getTasksByUserId', async () => {
            TaskModel.getTasksByUserId.mockResolvedValue([]);
            await taskService.getTasksByUserId(1, { status: 'open' });
            expect(TaskModel.getTasksByUserId).toHaveBeenCalledWith(1, { status: 'open' });
        });
    });
});
