"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterReviewSchema = exports.reviewSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// Custom validation for ObjectId
const objectId = () => joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/, "ObjectId");
// Schema for creating/updating a review
exports.reviewSchema = joi_1.default.object({
    // user_id will come from authenticated user (req.user.id)
    hotel_id: objectId().required().messages({
        "string.pattern.name": `"hotel_id" must be a valid MongoDB ObjectId`,
        "any.required": `"hotel_id" is a required field`,
    }),
    rating: joi_1.default.number().integer().min(1).max(5).required().messages({
        "number.base": `"rating" should be a type of 'number'`,
        "number.integer": `"rating" must be an integer`,
        "number.min": `"rating" must be at least {#limit}`,
        "number.max": `"rating" must be at most {#limit}`,
        "any.required": `"rating" is a required field`,
    }),
    comment: joi_1.default.string().trim().optional().allow("").messages({
        // Allow empty string for comment
        "string.base": `"comment" should be a type of 'text'`,
    }),
});
// Schema for filtering reviews (query parameters)
exports.filterReviewSchema = joi_1.default.object({
    hotel_id: objectId().optional().messages({
        // Filter by hotel
        "string.pattern.name": `"hotel_id" must be a valid MongoDB ObjectId`,
    }),
    user_id: objectId().optional().messages({
        // Filter by user
        "string.pattern.name": `"user_id" must be a valid MongoDB ObjectId`,
    }),
    min_rating: joi_1.default.number().integer().min(1).max(5).optional(),
    max_rating: joi_1.default.number()
        .integer()
        .min(1)
        .max(5)
        .greater(joi_1.default.ref("min_rating"))
        .optional(),
    page: joi_1.default.number().integer().min(1).optional().default(1),
    limit: joi_1.default.number().integer().min(1).max(100).optional().default(10),
});
