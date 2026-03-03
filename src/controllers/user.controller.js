const e = require("express");
const User = require("../models/user.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.createUser = catchAsync(async (req, res,next) => {
    const {email,password,role} = req.body;
    const existingUser = await User.findByEmail(email);
    if(existingUser){
        return next(new AppError("Email already in use",400));
    }
    const result = await User.create(email,password,role);
    res.status(201).json({
        status: "success",
        message: "User created successfully",
        userId:result.insertId,
    });
});