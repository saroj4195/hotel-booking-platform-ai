"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Basic error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error("ERROR STACK:", err.stack); // Log the error stack for debugging
    // Default error status and message
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Use existing status code if set, otherwise default to 500
    let message = err.message || "Internal Server Error";
    // Mongoose bad ObjectId Error
    if (err.name === "CastError" && err.kind === "ObjectId") {
        statusCode = 404; // Or 400 depending on context
        message = "Resource not found (Invalid ID)";
    }
    // Mongoose duplicate key Error (e.g., unique email)
    if (err.code === 11000) {
        statusCode = 400;
        // Extract field name from error message if possible
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate field value entered: ${field}`;
    }
    // Mongoose validation Error
    if (err.name === "ValidationError") {
        statusCode = 400;
        // Combine multiple validation errors if present
        const errors = Object.values(err.errors).map((el) => el.message);
        message = `Invalid input data: ${errors.join(". ")}`;
        // Optionally send detailed errors back in development
        // return res.status(statusCode).json({ message, errors: err.errors });
    }
    // JWT Errors (already handled in protect middleware, but catch here just in case)
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Not authorized, invalid token";
    }
    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Not authorized, token expired";
    }
    // Send the response
    res.status(statusCode).json({
        message: message,
        // Optionally include stack trace in development environment
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
};
exports.default = errorHandler;
