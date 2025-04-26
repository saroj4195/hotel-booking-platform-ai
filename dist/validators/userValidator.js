"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterUserSchema = exports.adminUpdateUserSchema = exports.updateUserProfileSchema = exports.loginUserSchema = exports.registerUserSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const User_1 = require("../models/User"); // Import enum for role validation
// Custom validation for ObjectId
const objectId = () => joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/, "ObjectId");
// Schema for user registration
exports.registerUserSchema = joi_1.default.object({
    name: joi_1.default.string().trim().required().messages({
        "string.base": `"name" should be a type of 'text'`,
        "string.empty": `"name" cannot be an empty field`,
        "any.required": `"name" is a required field`,
    }),
    email: joi_1.default.string().email().required().lowercase().messages({
        "string.base": `"email" should be a type of 'text'`,
        "string.email": `"email" must be a valid email address`,
        "string.empty": `"email" cannot be an empty field`,
        "any.required": `"email" is a required field`,
    }),
    password: joi_1.default.string().min(6).required().messages({
        // Enforce minimum password length
        "string.base": `"password" should be a type of 'text'`,
        "string.min": `"password" should have a minimum length of {#limit}`,
        "string.empty": `"password" cannot be an empty field`,
        "any.required": `"password" is a required field`,
    }),
    // Role might be assigned internally or restricted during registration
    // role: Joi.string().valid(...Object.values(UserRole)).optional(),
});
// Schema for user login
exports.loginUserSchema = joi_1.default.object({
    email: joi_1.default.string().email().required().lowercase().messages({
        "string.base": `"email" should be a type of 'text'`,
        "string.email": `"email" must be a valid email address`,
        "string.empty": `"email" cannot be an empty field`,
        "any.required": `"email" is a required field`,
    }),
    password: joi_1.default.string().required().messages({
        "string.base": `"password" should be a type of 'text'`,
        "string.empty": `"password" cannot be an empty field`,
        "any.required": `"password" is a required field`,
    }),
});
// Schema for updating user profile (e.g., name, email)
// Password update should likely be a separate endpoint/process
exports.updateUserProfileSchema = joi_1.default.object({
    name: joi_1.default.string().trim().optional().messages({
        "string.base": `"name" should be a type of 'text'`,
    }),
    email: joi_1.default.string().email().lowercase().optional().messages({
        "string.base": `"email" should be a type of 'text'`,
        "string.email": `"email" must be a valid email address`,
    }),
    // Do not allow role update via this schema usually
}).min(1); // Ensure at least one field is provided for update
// Optional: Schema for admin updating user details (might include role)
exports.adminUpdateUserSchema = joi_1.default.object({
    name: joi_1.default.string().trim().optional(),
    email: joi_1.default.string().email().lowercase().optional(),
    role: joi_1.default.string()
        .valid(...Object.values(User_1.UserRole))
        .optional(),
    // Password update should be handled separately
}).min(1);
// Schema for filtering users (query parameters - Admin only)
exports.filterUserSchema = joi_1.default.object({
    name: joi_1.default.string().trim().optional(),
    email: joi_1.default.string().email().lowercase().optional(),
    role: joi_1.default.string()
        .valid(...Object.values(User_1.UserRole))
        .optional(),
    page: joi_1.default.number().integer().min(1).optional().default(1),
    limit: joi_1.default.number().integer().min(1).max(100).optional().default(10),
});
