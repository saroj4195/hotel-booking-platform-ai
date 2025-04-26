"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
// Import routes and middleware later as they are created
const hotelRoutes_1 = __importDefault(require("./routes/hotelRoutes")); // Import hotel routes
const roomRoutes_1 = __importDefault(require("./routes/roomRoutes")); // Import room routes
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes")); // Import booking routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes")); // Import auth routes
const userRoutes_1 = __importDefault(require("./routes/userRoutes")); // Import user routes
const reviewRoutes_1 = __importDefault(require("./routes/reviewRoutes")); // Import review routes
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes")); // Import admin routes
// import { authMiddleware } from "./middleware/authMiddleware"; // Example path
const errorHandler_1 = __importDefault(require("./middleware/errorHandler")); // Import error handler
dotenv.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
mongoose_1.default
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
            description: "This is a REST API for a Hotel Booking Platform, with JWT authentication.",
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
const specs = (0, swagger_jsdoc_1.default)(options);
// Express middleware
app.use((0, cors_1.default)()); // Enable CORS
app.use(express_1.default.json());
// API routes
app.use("/api/hotels", hotelRoutes_1.default); // Mount hotel routes
app.use("/api/rooms", roomRoutes_1.default); // Mount room routes
app.use("/api/bookings", bookingRoutes_1.default); // Mount booking routes
app.use("/api/auth", authRoutes_1.default); // Mount auth routes
app.use("/api/users", userRoutes_1.default); // Mount user routes
app.use("/api/reviews", reviewRoutes_1.default); // Mount review routes
app.use("/api/admin", adminRoutes_1.default); // Mount admin routes
// Add other routes here later
// Swagger UI - Serve at the root or a specific path like /api-docs
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
// Central Error Handler - Must be last middleware
app.use(errorHandler_1.default);
// Basic check route (optional)
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
