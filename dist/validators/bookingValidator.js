"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterBookingSchema = exports.updateBookingSchema = exports.createBookingSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const Booking_1 = require("../models/Booking"); // Import enum for status validation
// Custom validation for ObjectId
const objectId = () => joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/, "ObjectId");
// Schema for creating a booking
exports.createBookingSchema = joi_1.default.object({
    // user_id will likely come from authenticated user context (req.user.id), not request body
    // user_id: objectId().required().messages({ ... }),
    room_id: objectId().required().messages({
        "string.pattern.name": `"room_id" must be a valid MongoDB ObjectId`,
        "any.required": `"room_id" is a required field`,
    }),
    // hotel_id can be derived from room_id, so not needed in request body
    // hotel_id: objectId().required().messages({ ... }),
    check_in_date: joi_1.default.date().iso().required().messages({
        "date.base": `"check_in_date" should be a valid date`,
        "date.format": `"check_in_date" must be in ISO 8601 date format`,
        "any.required": `"check_in_date" is required`,
    }),
    check_out_date: joi_1.default.date()
        .iso()
        .required()
        .greater(joi_1.default.ref("check_in_date"))
        .messages({
        "date.base": `"check_out_date" should be a valid date`,
        "date.format": `"check_out_date" must be in ISO 8601 date format`,
        "date.greater": `"check_out_date" must be after "check_in_date"`,
        "any.required": `"check_out_date" is required`,
    }),
    // Status is usually set internally, not by user on creation
    // status: Joi.string().valid(...Object.values(BookingStatus)).optional(),
    // total_price is calculated internally
});
// Schema for updating a booking (e.g., by admin to change status)
exports.updateBookingSchema = joi_1.default.object({
    // Only allow updating specific fields, e.g., status by admin
    status: joi_1.default.string()
        .valid(...Object.values(Booking_1.BookingStatus))
        .required()
        .messages({
        "string.base": `"status" should be a type of 'text'`,
        "any.only": `"status" must be one of [${Object.values(Booking_1.BookingStatus).join(", ")}]`,
        "any.required": `"status" is a required field`,
    }),
    // Other fields like dates, room, user are generally not updatable after creation
    // check_in_date: Joi.date().iso().optional(),
    // check_out_date: Joi.date().iso().greater(Joi.ref('check_in_date')).optional(),
    // room_id: objectId().optional(),
}).min(1); // Ensure at least status is provided
// Schema for filtering bookings (query parameters)
exports.filterBookingSchema = joi_1.default.object({
    user_id: objectId().optional().messages({
        // Filter by user (e.g., for user's own bookings)
        "string.pattern.name": `"user_id" must be a valid MongoDB ObjectId`,
    }),
    hotel_id: objectId().optional().messages({
        // Filter by hotel (e.g., for admin panel)
        "string.pattern.name": `"hotel_id" must be a valid MongoDB ObjectId`,
    }),
    room_id: objectId().optional().messages({
        // Filter by specific room
        "string.pattern.name": `"room_id" must be a valid MongoDB ObjectId`,
    }),
    status: joi_1.default.string()
        .valid(...Object.values(Booking_1.BookingStatus))
        .optional()
        .messages({
        "any.only": `"status" must be one of [${Object.values(Booking_1.BookingStatus).join(", ")}]`,
    }),
    check_in_after: joi_1.default.date().iso().optional(), // Bookings starting after this date
    check_out_before: joi_1.default.date().iso().optional(), // Bookings ending before this date
    page: joi_1.default.number().integer().min(1).optional().default(1),
    limit: joi_1.default.number().integer().min(1).max(100).optional().default(10),
});
