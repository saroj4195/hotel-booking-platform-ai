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
exports.loginUser = exports.registerUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const generateToken_1 = __importDefault(require("../utils/generateToken"));
const mongoose_1 = __importDefault(require("mongoose"));
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    try {
        // Check if user already exists
        const userExists = yield User_1.default.findOne({ email });
        if (userExists) {
            return res
                .status(400)
                .json({ message: "User already exists with this email" });
        }
        // Create new user (password hashing handled by pre-save middleware in User model)
        const user = new User_1.default({
            name,
            email,
            password,
            // Role defaults to 'user' as defined in the model
        });
        const savedUser = yield user.save();
        // Don't send password back, even hashed (it's selected: false anyway)
        const userResponse = {
            _id: savedUser._id,
            name: savedUser.name,
            email: savedUser.email,
            role: savedUser.role,
            createdAt: savedUser.createdAt,
            updatedAt: savedUser.updatedAt,
            // Cast _id to ObjectId before passing to generateToken
            token: (0, generateToken_1.default)(savedUser._id, savedUser.role),
        };
        res.status(201).json(userResponse); // Removed return
    }
    catch (error) {
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res
                .status(400)
                .json({ message: "Validation Error", details: error.errors });
        }
        // Handle potential duplicate key error (email) more specifically if needed
        if (error.code === 11000) {
            return res.status(400).json({ message: "Email already registered" });
        }
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Server error registering user" });
        // next(error);
    }
});
exports.registerUser = registerUser;
// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        // Find user by email, explicitly select password which is normally excluded
        const user = yield User_1.default.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" }); // Generic message
        }
        // Check if password matches
        const isMatch = yield user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" }); // Generic message
        }
        // Password matched, generate token and send response
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            // Cast _id to ObjectId before passing to generateToken
            token: (0, generateToken_1.default)(user._id, user.role),
        };
        res.status(200).json(userResponse); // Removed return
    }
    catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ message: "Server error logging in" });
        // next(error);
    }
});
exports.loginUser = loginUser;
