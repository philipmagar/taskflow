const Task = require("../models/task.model");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createTask = catchAsync(async (req, res, next) => {

    const { title, description } = req.body;

    if (!title) {
        return next(new AppError("Task title is required", 400));
    }

    const result = await Task.createTask(title, description, req.user.id);

    res.status(201).json({
        status: "success",
        message: "Task created successfully",
        taskId: result.insertId
    });

});