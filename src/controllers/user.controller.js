const User = require("../models/user.model");

exports.createUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const result = await User.create(email, password, role);

        res.status(201).json({
            message: "User created successfully",
            userId: result.insertId,
        });
    } catch (error) {
        console.error("Error in controller:", error);
        res.status(500).json({ message: "Server error", error });
    }
};