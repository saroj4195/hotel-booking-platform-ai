import Joi from "joi";
import { UserRole } from "../models/User"; // Import enum for role validation

// Custom validation for ObjectId
const objectId = () => Joi.string().pattern(/^[0-9a-fA-F]{24}$/, "ObjectId");

// Schema for user registration
export const registerUserSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.base": `"name" should be a type of 'text'`,
    "string.empty": `"name" cannot be an empty field`,
    "any.required": `"name" is a required field`,
  }),
  email: Joi.string().email().required().lowercase().messages({
    "string.base": `"email" should be a type of 'text'`,
    "string.email": `"email" must be a valid email address`,
    "string.empty": `"email" cannot be an empty field`,
    "any.required": `"email" is a required field`,
  }),
  password: Joi.string().min(6).required().messages({
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
export const loginUserSchema = Joi.object({
  email: Joi.string().email().required().lowercase().messages({
    "string.base": `"email" should be a type of 'text'`,
    "string.email": `"email" must be a valid email address`,
    "string.empty": `"email" cannot be an empty field`,
    "any.required": `"email" is a required field`,
  }),
  password: Joi.string().required().messages({
    "string.base": `"password" should be a type of 'text'`,
    "string.empty": `"password" cannot be an empty field`,
    "any.required": `"password" is a required field`,
  }),
});

// Schema for updating user profile (e.g., name, email)
// Password update should likely be a separate endpoint/process
export const updateUserProfileSchema = Joi.object({
  name: Joi.string().trim().optional().messages({
    "string.base": `"name" should be a type of 'text'`,
  }),
  email: Joi.string().email().lowercase().optional().messages({
    "string.base": `"email" should be a type of 'text'`,
    "string.email": `"email" must be a valid email address`,
  }),
  // Do not allow role update via this schema usually
}).min(1); // Ensure at least one field is provided for update

// Optional: Schema for admin updating user details (might include role)
export const adminUpdateUserSchema = Joi.object({
  name: Joi.string().trim().optional(),
  email: Joi.string().email().lowercase().optional(),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional(),
  // Password update should be handled separately
}).min(1);

// Schema for filtering users (query parameters - Admin only)
export const filterUserSchema = Joi.object({
  name: Joi.string().trim().optional(),
  email: Joi.string().email().lowercase().optional(),
  role: Joi.string()
    .valid(...Object.values(UserRole))
    .optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
});
