const taskController = require('../../../src/controllers/task.controller');
const TaskService = require('../../../src/services/task.service');
const apiResponse = require('../../../src/utils/apiResponse');
const AppError = require('../../../src/utils/appError');

jest.mock('../src/services/task.service');
jest.mock('../src/utils/apiResponse');
jest.mock('../src/utils/logger');

describe('Task Controller Units', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            user: { id: 1 },
            params: {},
            query: {},
            body: {},
            requestId: 'test-req-id'
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getTasks', () => {
        it('should fetch tasks and return success', async () => {
            const tasks = [{ id: 1, title: 'Task 1' }];
            TaskService.getTasks.mockResolvedValue(tasks);

            await taskController.getTasks(req, res, next);

            expect(TaskService.getTasks).toHaveBeenCalledWith(req.user.id, req.query);
            expect(apiResponse.success).toHaveBeenCalledWith(res, 'Tasks fetched', { results: 1, tasks });
        });
    });

    describe('createTask', () => {
        it('should create task and return 201', async () => {
            req.body = { title: 'New Task', description: 'Desc', extra: 'ignored' };
            TaskService.createTask.mockResolvedValue({ insertId: 101 });

            await taskController.createTask(req, res, next);

            expect(TaskService.createTask).toHaveBeenCalledWith('New Task', 'Desc', req.user.id);
            expect(apiResponse.success).toHaveBeenCalledWith(res, 'Task created successfully', { taskId: 101 }, 201);
        });
    });

    describe('getTaskById', () => {
        it('should return task if found', async () => {
            req.params.id = '10';
            const task = { id: 10, title: 'Found' };
            TaskService.getTaskById.mockResolvedValue(task);

            await taskController.getTaskById(req, res, next);

            expect(TaskService.getTaskById).toHaveBeenCalledWith('10', req.user.id);
            expect(apiResponse.success).toHaveBeenCalledWith(res, 'Task fetched', { task });
        });
    });

    describe('updateTask', () => {
        it('should update task and return success', async () => {
            req.params.id = '10';
            req.body = { title: 'Updated' };
            TaskService.updateTask.mockResolvedValue(true);

            await taskController.updateTask(req, res, next);

            expect(TaskService.updateTask).toHaveBeenCalledWith('10', req.user.id, { title: 'Updated' });
            expect(apiResponse.success).toHaveBeenCalledWith(res, 'Task updated successfully');
        });

        it('should fail if no data provided', async () => {
            req.body = {};
            await taskController.updateTask(req, res, next);
            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });
    });

    describe('deleteTask', () => {
        it('should delete task and return 204', async () => {
            req.params.id = '10';
            TaskService.deleteTask.mockResolvedValue(true);

            await taskController.deleteTask(req, res, next);

            expect(TaskService.deleteTask).toHaveBeenCalledWith('10', req.user.id);
            expect(res.status).toHaveBeenCalledWith(204);
        });
    });
});
