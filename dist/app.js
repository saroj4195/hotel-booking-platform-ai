"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const middleware_1 = require("./middleware");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
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
        },
    },
    apis: ["./src/routes.ts"], // Path to the API routes
};
const specs = (0, swagger_jsdoc_1.default)(options);
// Express middleware
app.use(express_1.default.json());
// JWT authentication middleware
app.use(middleware_1.authMiddleware);
// API routes
app.use(routes_1.default);
// Swagger UI
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
app.get("/", (req, res) => {
    res.send("Hello, world!");
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
