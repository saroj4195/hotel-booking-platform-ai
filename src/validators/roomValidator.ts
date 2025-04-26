import Joi from "joi";

// Custom validation for ObjectId
const objectId = () => Joi.string().pattern(/^[0-9a-fA-F]{24}$/, "ObjectId");

// Schema for available date range subdocument
const availableDateRangeSchema = Joi.object({
  startDate: Joi.date().iso().required().messages({
    "date.base": `"startDate" should be a valid date`,
    "date.format": `"startDate" must be in ISO 8601 date format`,
    "any.required": `"startDate" is required`,
  }),
  endDate: Joi.date().iso().required().greater(Joi.ref("startDate")).messages({
    "date.base": `"endDate" should be a valid date`,
    "date.format": `"endDate" must be in ISO 8601 date format`,
    "date.greater": `"endDate" must be after "startDate"`,
    "any.required": `"endDate" is required`,
  }),
});

// Schema for creating a room
export const createRoomSchema = Joi.object({
  room_type: Joi.string().trim().required().messages({
    "string.base": `"room_type" should be a type of 'text'`,
    "string.empty": `"room_type" cannot be an empty field`,
    "any.required": `"room_type" is a required field`,
  }),
  price: Joi.number().positive().required().messages({
    "number.base": `"price" should be a type of 'number'`,
    "number.positive": `"price" must be a positive number`,
    "any.required": `"price" is a required field`,
  }),
  available_dates: Joi.array()
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
export const updateRoomSchema = Joi.object({
  room_type: Joi.string().trim().optional().messages({
    "string.base": `"room_type" should be a type of 'text'`,
  }),
  price: Joi.number().positive().optional().messages({
    "number.base": `"price" should be a type of 'number'`,
    "number.positive": `"price" must be a positive number`,
  }),
  available_dates: Joi.array()
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
export const filterRoomSchema = Joi.object({
  hotel_id: objectId().optional().messages({
    "string.pattern.name": `"hotel_id" must be a valid MongoDB ObjectId`,
  }),
  available_start: Joi.date().iso().optional().messages({
    "date.base": `"available_start" should be a valid date`,
    "date.format": `"available_start" must be in ISO 8601 date format`,
  }),
  available_end: Joi.date()
    .iso()
    .greater(Joi.ref("available_start"))
    .optional()
    .messages({
      "date.base": `"available_end" should be a valid date`,
      "date.format": `"available_end" must be in ISO 8601 date format`,
      "date.greater": `"available_end" must be after "available_start"`,
    }),
  min_price: Joi.number().positive().optional(),
  max_price: Joi.number().positive().greater(Joi.ref("min_price")).optional(),
  room_type: Joi.string().trim().optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10), // Max limit 100
}).with("available_end", "available_start"); // If available_end is provided, available_start must also be provided
