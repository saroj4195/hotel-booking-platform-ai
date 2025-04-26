import Joi from "joi";

// Schema for creating a hotel
export const createHotelSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.base": `"name" should be a type of 'text'`,
    "string.empty": `"name" cannot be an empty field`,
    "any.required": `"name" is a required field`,
  }),
  location: Joi.string().trim().required().messages({
    "string.base": `"location" should be a type of 'text'`,
    "string.empty": `"location" cannot be an empty field`,
    "any.required": `"location" is a required field`,
  }),
  description: Joi.string().required().messages({
    "string.base": `"description" should be a type of 'text'`,
    "string.empty": `"description" cannot be an empty field`,
    "any.required": `"description" is a required field`,
  }),
  photos: Joi.array().items(Joi.string().uri()).optional().messages({
    "array.base": `"photos" should be an array`,
    "string.uri": `Each photo URL must be a valid URI`,
  }),
  rating: Joi.number().min(0).max(5).optional().messages({
    "number.base": `"rating" should be a type of 'number'`,
    "number.min": `"rating" must be greater than or equal to 0`,
    "number.max": `"rating" must be less than or equal to 5`,
  }),
});

// Schema for updating a hotel (all fields optional)
export const updateHotelSchema = Joi.object({
  name: Joi.string().trim().optional().messages({
    "string.base": `"name" should be a type of 'text'`,
  }),
  location: Joi.string().trim().optional().messages({
    "string.base": `"location" should be a type of 'text'`,
  }),
  description: Joi.string().optional().messages({
    "string.base": `"description" should be a type of 'text'`,
  }),
  photos: Joi.array().items(Joi.string().uri()).optional().messages({
    "array.base": `"photos" should be an array`,
    "string.uri": `Each photo URL must be a valid URI`,
  }),
  rating: Joi.number().min(0).max(5).optional().messages({
    "number.base": `"rating" should be a type of 'number'`,
    "number.min": `"rating" must be greater than or equal to 0`,
    "number.max": `"rating" must be less than or equal to 5`,
  }),
}).min(1); // Ensure at least one field is provided for update
