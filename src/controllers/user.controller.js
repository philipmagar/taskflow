const User = require("../models/user.model");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const apiResponse = require("../utils/apiResponse");
const bcrypt = require("bcryptjs");
exports.createUser = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const existingUser = await User.findByEmail(email);     
    
    if (existingUser) {
        return next(new AppError('Email already in use', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const result = await User.create(email, hashedPassword);
    apiResponse.success(res, "User created successfully", {
        userId: result.insertId,
        email: email,
        role: "member"
    }, 201);
});