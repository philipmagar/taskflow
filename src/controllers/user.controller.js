const e = require("express");
const User = require("../models/user.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const bycrypt = require("bcryptjs");
exports.createUser = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const existingUser = await User.findByEmail(email);     
    
    if (existingUser) {
        return next(new AppError('Email already in use', 400));
    }

    const hashedPassword = await bycrypt.hash(password, 12);
    
    const result = await User.create(email, hashedPassword);
    res.status(201).json({
        status: 'success',
        data: {
            userId: result.insertId,
            email,
            role : "member"
        }
    });
});