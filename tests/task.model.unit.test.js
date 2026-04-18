const taskModel = require('../src/models/task.model');
const pool = require('../src/config/db');

jest.mock('../src/config/db');

describe('Task Model Units', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createTask', () => {
        it('should call pool.query with correct sql', async () => {
            pool.query.mockResolvedValue([{ insertId: 1 }]);
            await taskModel.createTask('T', 'D', 1);
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO tasks'),
                ['T', 'D', 1]
            );
        });
    });

    describe('getTasksByUserId', () => {
        it('should handle sorting and filtering', async () => {
            pool.query.mockResolvedValue([[]]);
            await taskModel.getTasksByUserId(1, { status: 'pending', sort: '-title', limit: 5 });
            
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('status = ? ORDER BY title DESC LIMIT ? OFFSET ?'),
                [1, 'pending', 5, 0]
            );
        });

        it('should use default pagination', async () => {
            pool.query.mockResolvedValue([[]]);
            await taskModel.getTasksByUserId(1);
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('LIMIT ? OFFSET ?'),
                [1, 10, 0]
            );
        });
    });

    describe('getTaskById', () => {
        it('should return the first row', async () => {
            const mockRow = { id: 10, title: 'Task' };
            pool.query.mockResolvedValue([[mockRow]]);
            const result = await taskModel.getTaskById(10);
            expect(result).toEqual(mockRow);
        });
    });

    describe('updateTask', () => {
        it('should call update query', async () => {
            pool.query.mockResolvedValue([{}]);
            await taskModel.updateTask(10, 'New Title', 'New Desc');
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE tasks SET title = ?, description = ? WHERE id = ?'),
                ['New Title', 'New Desc', 10]
            );
        });
    });

    describe('getTasksAdvanced', () => {
        it('should handle complex filtering and sorting', async () => {
             pool.query.mockResolvedValue([[]]);
             await taskModel.getTasksAdvanced(1, { status: 'done', sort: 'title', limit: '20', page: '2' });
             
             expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('status = ? ORDER BY title LIMIT ? OFFSET ?'),
                [1, 'done', 20, 20]
             );
        });

        it('should use default sorting if not provided', async () => {
            pool.query.mockResolvedValue([[]]);
            await taskModel.getTasksAdvanced(1, {});
            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('ORDER BY created_at DESC'),
                expect.any(Array)
            );
        });
    });

    describe('deleteTask', () => {
        it('should call delete query', async () => {
             pool.query.mockResolvedValue([{}]);
             await taskModel.deleteTask(10);
             expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM tasks WHERE id = ?'),
                [10]
             );
        });
    });
});
