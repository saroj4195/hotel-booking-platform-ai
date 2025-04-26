import Joi from "joi";

// Custom validation for ObjectId
const objectId = () => Joi.string().pattern(/^[0-9a-fA-F]{24}$/, "ObjectId");

// Schema for creating/updating a review
export const reviewSchema = Joi.object({
  // user_id will come from authenticated user (req.user.id)
  hotel_id: objectId().required().messages({
    "string.pattern.name": `"hotel_id" must be a valid MongoDB ObjectId`,
    "any.required": `"hotel_id" is a required field`,
  }),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    "number.base": `"rating" should be a type of 'number'`,
    "number.integer": `"rating" must be an integer`,
    "number.min": `"rating" must be at least {#limit}`,
    "number.max": `"rating" must be at most {#limit}`,
    "any.required": `"rating" is a required field`,
  }),
  comment: Joi.string().trim().optional().allow("").messages({
    // Allow empty string for comment
    "string.base": `"comment" should be a type of 'text'`,
  }),
});

// Schema for filtering reviews (query parameters)
export const filterReviewSchema = Joi.object({
  hotel_id: objectId().optional().messages({
    // Filter by hotel
    "string.pattern.name": `"hotel_id" must be a valid MongoDB ObjectId`,
  }),
  user_id: objectId().optional().messages({
    // Filter by user
    "string.pattern.name": `"user_id" must be a valid MongoDB ObjectId`,
  }),
  min_rating: Joi.number().integer().min(1).max(5).optional(),
  max_rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .greater(Joi.ref("min_rating"))
    .optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
});
