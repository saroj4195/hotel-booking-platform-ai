import express, { Request, Response, RequestHandler } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { authMiddleware } from "./middleware";
import routes from "./routes";
import mongoose from "mongoose";
import * as dotenv from "dotenv";

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
    },
  },
  apis: ["./src/routes.ts"], // Path to the API routes
};

const specs = swaggerJsdoc(options);

// Express middleware
app.use(express.json());

// JWT authentication middleware
app.use(authMiddleware as RequestHandler);

// API routes
app.use(routes);

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, world!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
