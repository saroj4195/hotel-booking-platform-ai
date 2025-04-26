"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHotelSchema = exports.createHotelSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// Schema for creating a hotel
exports.createHotelSchema = joi_1.default.object({
    name: joi_1.default.string().trim().required().messages({
        "string.base": `"name" should be a type of 'text'`,
        "string.empty": `"name" cannot be an empty field`,
        "any.required": `"name" is a required field`,
    }),
    location: joi_1.default.string().trim().required().messages({
        "string.base": `"location" should be a type of 'text'`,
        "string.empty": `"location" cannot be an empty field`,
        "any.required": `"location" is a required field`,
    }),
    description: joi_1.default.string().required().messages({
        "string.base": `"description" should be a type of 'text'`,
        "string.empty": `"description" cannot be an empty field`,
        "any.required": `"description" is a required field`,
    }),
    photos: joi_1.default.array().items(joi_1.default.string().uri()).optional().messages({
        "array.base": `"photos" should be an array`,
        "string.uri": `Each photo URL must be a valid URI`,
    }),
    rating: joi_1.default.number().min(0).max(5).optional().messages({
        "number.base": `"rating" should be a type of 'number'`,
        "number.min": `"rating" must be greater than or equal to 0`,
        "number.max": `"rating" must be less than or equal to 5`,
    }),
});
// Schema for updating a hotel (all fields optional)
exports.updateHotelSchema = joi_1.default.object({
    name: joi_1.default.string().trim().optional().messages({
        "string.base": `"name" should be a type of 'text'`,
    }),
    location: joi_1.default.string().trim().optional().messages({
        "string.base": `"location" should be a type of 'text'`,
    }),
    description: joi_1.default.string().optional().messages({
        "string.base": `"description" should be a type of 'text'`,
    }),
    photos: joi_1.default.array().items(joi_1.default.string().uri()).optional().messages({
        "array.base": `"photos" should be an array`,
        "string.uri": `Each photo URL must be a valid URI`,
    }),
    rating: joi_1.default.number().min(0).max(5).optional().messages({
        "number.base": `"rating" should be a type of 'number'`,
        "number.min": `"rating" must be greater than or equal to 0`,
        "number.max": `"rating" must be less than or equal to 5`,
    }),
}).min(1); // Ensure at least one field is provided for update
