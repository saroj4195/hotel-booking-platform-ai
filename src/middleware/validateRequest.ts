import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";

export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validate request body, query params, or path params as needed
    // Here we assume validation is for the body
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors found
      stripUnknown: true, // Remove properties not defined in the schema
      allowUnknown: false, // Disallow properties not defined in the schema
    });

    if (error) {
      // Map Joi error details to a more user-friendly format
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message.replace(/['"]/g, ""), // Clean up quotes
      }));
      // Send a 400 Bad Request response with the validation errors
      return res.status(400).json({ message: "Validation Error", errors });
    }

    // If validation passes, replace req.body with the validated (and potentially stripped) value
    req.body = value;
    // Pass control to the next middleware or route handler
    next();
  };
};
