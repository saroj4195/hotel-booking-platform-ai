import express, { Request, Response, NextFunction, Express } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import cors from "cors";
// Import routes and middleware later as they are created
import hotelRoutes from "./routes/hotelRoutes"; // Import hotel routes
import roomRoutes from "./routes/roomRoutes"; // Import room routes
import bookingRoutes from "./routes/bookingRoutes"; // Import booking routes
import authRoutes from "./routes/authRoutes"; // Import auth routes
import userRoutes from "./routes/userRoutes"; // Import user routes
import reviewRoutes from "./routes/reviewRoutes"; // Import review routes
import adminRoutes from "./routes/adminRoutes"; // Import admin routes
// import { authMiddleware } from "./middleware/authMiddleware"; // Example path
import errorHandler from "./middleware/errorHandler"; // Import error handler

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI || "")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

// Swagger configuration
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hotel Booking Platform API",
      version: "1.0.0",
      description:
        "This is a REST API for a Hotel Booking Platform, with JWT authentication.",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    }, // Removed extra closing brace here
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api`,
        description: "Development server",
      },
    ],
    security: [
      // Add security definition globally or per-route
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/**/*.ts"], // Scan all .ts files in the routes directory
};

const specs = swaggerJsdoc(options);

// Express middleware
app.use(cors()); // Enable CORS
app.use(express.json());

// API routes
app.use("/api/hotels", hotelRoutes); // Mount hotel routes
app.use("/api/rooms", roomRoutes); // Mount room routes
app.use("/api/bookings", bookingRoutes); // Mount booking routes
app.use("/api/auth", authRoutes); // Mount auth routes
app.use("/api/users", userRoutes); // Mount user routes
app.use("/api/reviews", reviewRoutes); // Mount review routes
app.use("/api/admin", adminRoutes); // Mount admin routes
// Add other routes here later

// Swagger UI - Serve at the root or a specific path like /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Central Error Handler - Must be last middleware
app.use(errorHandler);

// Basic check route (optional)
app.get("/health", (req: Request, res: Response) => {
  res.status(200).send("OK");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
