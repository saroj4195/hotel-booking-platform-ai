"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.getUsers = exports.updateUserProfile = exports.getUserProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
const userValidator_1 = require("../validators/userValidator"); // For admin filtering
// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (User)
const getUserProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // User object is attached to req by the 'protect' middleware
    const user = req.user;
    if (user) {
        // Return user data (password is excluded by default in the model)
        // No return here
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    }
    else {
        res.status(404).json({ message: "User not found" }); // Should not happen if protect middleware works
    }
});
exports.getUserProfile = getUserProfile;
// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private (User)
const updateUserProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield User_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a._id); // Get user from DB based on authenticated user ID
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    // Update fields if provided in request body
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email; // Add check for email uniqueness if changed
    // Handle password update separately if needed (e.g., requires current password)
    // if (req.body.password) { user.password = req.body.password; }
    try {
        // Check if email is being changed and if the new email already exists
        if (req.body.email && req.body.email !== user.email) {
            const emailExists = yield User_1.default.findOne({ email: req.body.email });
            if (emailExists) {
                return res.status(400).json({ message: "Email already in use" });
            }
        }
        const updatedUser = yield user.save(); // Pre-save hook will handle password hashing if password field is updated
        // No return here
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
            // Optionally regenerate token if email/role changes affect it, but usually not needed for profile update
        });
    }
    catch (error) {
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res
                .status(400)
                .json({ message: "Validation Error", details: error.errors });
        }
        if (error.code === 11000) {
            // Handle duplicate email error on save
            return res.status(400).json({ message: "Email already registered" });
        }
        console.error("Error updating user profile:", error);
        res.status(500).json({ message: "Server error updating profile" });
        // next(error);
    }
});
exports.updateUserProfile = updateUserProfile;
// --- Admin Routes ---
// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate query parameters
        const { error, value: queryParams } = userValidator_1.filterUserSchema.validate(req.query, {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: false,
        });
        if (error) {
            const errors = error.details.map((d) => ({
                field: d.path.join("."),
                message: d.message.replace(/['"]/g, ""),
            }));
            return res
                .status(400)
                .json({ message: "Invalid query parameters", errors });
        }
        const { page = 1, limit = 10, name, email, role } = queryParams;
        const skip = (page - 1) * limit;
        // Build filter object
        const filter = {};
        if (name)
            filter.name = { $regex: name, $options: "i" };
        if (email)
            filter.email = { $regex: email, $options: "i" };
        if (role)
            filter.role = role;
        const users = yield User_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const totalUsers = yield User_1.default.countDocuments(filter);
        // No return here
        res.status(200).json({
            data: users, // Passwords are excluded by default
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalItems: totalUsers,
                limit: limit,
            },
        });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error fetching users" });
        // next(error);
    }
});
exports.getUsers = getUsers;
// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin)
const getUserById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid User ID format" });
        }
        const user = yield User_1.default.findById(userId); // Password excluded by default
        if (user) {
            // No return here
            res.json(user);
        }
        else {
            res.status(404).json({ message: "User not found" });
        }
    }
    catch (error) {
        console.error("Error fetching user by ID:", error);
        res.status(500).json({ message: "Server error fetching user" });
        // next(error);
    }
});
exports.getUserById = getUserById;
// @desc    Update user by ID (Admin)
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid User ID format" });
        }
        const user = yield User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Update fields if provided
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role; // Admin can update role
        // Check if email is being changed and if the new email already exists
        if (req.body.email && req.body.email !== user.email) {
            const emailExists = yield User_1.default.findOne({ email: req.body.email });
            if (emailExists) {
                return res
                    .status(400)
                    .json({ message: "Email already in use by another user" });
            }
        }
        const updatedUser = yield user.save();
        // No return here
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
        });
    }
    catch (error) {
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res
                .status(400)
                .json({ message: "Validation Error", details: error.errors });
        }
        if (error.code === 11000) {
            // Handle duplicate email error on save
            return res.status(400).json({ message: "Email already registered" });
        }
        console.error("Error updating user (admin):", error);
        res.status(500).json({ message: "Server error updating user" });
        // next(error);
    }
});
exports.updateUser = updateUser;
// @desc    Delete user by ID
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid User ID format" });
        }
        const user = yield User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // TODO: Add check to prevent admin from deleting themselves? Or handle related data (bookings, reviews)?
        yield User_1.default.findByIdAndDelete(userId);
        // No return here
        res.json({ message: "User removed successfully", userId: user._id });
    }
    catch (error) {
        console.error("Error deleting user (admin):", error);
        res.status(500).json({ message: "Server error deleting user" });
        // next(error);
    }
});
exports.deleteUser = deleteUser;
