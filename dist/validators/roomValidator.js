"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterRoomSchema = exports.updateRoomSchema = exports.createRoomSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// Custom validation for ObjectId
const objectId = () => joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/, "ObjectId");
// Schema for available date range subdocument
const availableDateRangeSchema = joi_1.default.object({
    startDate: joi_1.default.date().iso().required().messages({
        "date.base": `"startDate" should be a valid date`,
        "date.format": `"startDate" must be in ISO 8601 date format`,
        "any.required": `"startDate" is required`,
    }),
    endDate: joi_1.default.date().iso().required().greater(joi_1.default.ref("startDate")).messages({
        "date.base": `"endDate" should be a valid date`,
        "date.format": `"endDate" must be in ISO 8601 date format`,
        "date.greater": `"endDate" must be after "startDate"`,
        "any.required": `"endDate" is required`,
    }),
});
// Schema for creating a room
exports.createRoomSchema = joi_1.default.object({
    room_type: joi_1.default.string().trim().required().messages({
        "string.base": `"room_type" should be a type of 'text'`,
        "string.empty": `"room_type" cannot be an empty field`,
        "any.required": `"room_type" is a required field`,
    }),
    price: joi_1.default.number().positive().required().messages({
        "number.base": `"price" should be a type of 'number'`,
        "number.positive": `"price" must be a positive number`,
        "any.required": `"price" is a required field`,
    }),
    available_dates: joi_1.default.array()
        .items(availableDateRangeSchema)
        .optional()
        .messages({
        "array.base": `"available_dates" should be an array`,
    }),
    hotel_id: objectId().required().messages({
        "string.pattern.name": `"hotel_id" must be a valid MongoDB ObjectId`,
        "any.required": `"hotel_id" is a required field`,
    }),
});
// Schema for updating a room (all fields optional)
exports.updateRoomSchema = joi_1.default.object({
    room_type: joi_1.default.string().trim().optional().messages({
        "string.base": `"room_type" should be a type of 'text'`,
    }),
    price: joi_1.default.number().positive().optional().messages({
        "number.base": `"price" should be a type of 'number'`,
        "number.positive": `"price" must be a positive number`,
    }),
    available_dates: joi_1.default.array()
        .items(availableDateRangeSchema)
        .optional()
        .messages({
        "array.base": `"available_dates" should be an array`,
    }),
    hotel_id: objectId().optional().messages({
        // Usually hotel_id shouldn't change, but included if needed
        "string.pattern.name": `"hotel_id" must be a valid MongoDB ObjectId`,
    }),
}).min(1); // Ensure at least one field is provided for update
// Schema for filtering rooms (query parameters)
exports.filterRoomSchema = joi_1.default.object({
    hotel_id: objectId().optional().messages({
        "string.pattern.name": `"hotel_id" must be a valid MongoDB ObjectId`,
    }),
    available_start: joi_1.default.date().iso().optional().messages({
        "date.base": `"available_start" should be a valid date`,
        "date.format": `"available_start" must be in ISO 8601 date format`,
    }),
    available_end: joi_1.default.date()
        .iso()
        .greater(joi_1.default.ref("available_start"))
        .optional()
        .messages({
        "date.base": `"available_end" should be a valid date`,
        "date.format": `"available_end" must be in ISO 8601 date format`,
        "date.greater": `"available_end" must be after "available_start"`,
    }),
    min_price: joi_1.default.number().positive().optional(),
    max_price: joi_1.default.number().positive().greater(joi_1.default.ref("min_price")).optional(),
    room_type: joi_1.default.string().trim().optional(),
    page: joi_1.default.number().integer().min(1).optional().default(1),
    limit: joi_1.default.number().integer().min(1).max(100).optional().default(10), // Max limit 100
}).with("available_end", "available_start"); // If available_end is provided, available_start must also be provided
