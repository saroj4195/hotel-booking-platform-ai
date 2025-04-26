"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Function to generate JWT token
const generateToken = (userId, userRole) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("JWT_SECRET is not defined in environment variables.");
        throw new Error("Server configuration error: JWT secret missing.");
        // In a real app, you might want to handle this more gracefully or prevent server start
    }
    // Create payload for the token
    const payload = {
        userId: userId.toString(), // Convert ObjectId to string
        role: userRole,
        // Add other relevant non-sensitive info if needed (e.g., name)
    };
    // Sign the token with the secret and set expiration (e.g., 1 day)
    const token = jsonwebtoken_1.default.sign(payload, secret, {
        expiresIn: "1d", // Token expires in 1 day (adjust as needed, e.g., '1h', '30m')
    });
    return token;
};
exports.default = generateToken;
