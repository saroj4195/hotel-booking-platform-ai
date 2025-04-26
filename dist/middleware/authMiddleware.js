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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importStar(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
// Middleware to protect routes - verifies JWT token
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    // Check for token in Authorization header (Bearer token)
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        try {
            // Get token from header
            token = req.headers.authorization.split(" ")[1];
            // Verify token
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                console.error("JWT_SECRET is not defined.");
                return res.status(500).json({ message: "Server configuration error" });
            }
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            // Validate the decoded payload structure
            if (!decoded ||
                typeof decoded !== "object" ||
                !decoded.userId ||
                !decoded.role) {
                throw new Error("Invalid token payload");
            }
            // Check if userId is a valid ObjectId
            if (!mongoose_1.default.Types.ObjectId.isValid(decoded.userId)) {
                throw new Error("Invalid user ID in token");
            }
            // Get user from the token payload (excluding password)
            req.user = yield User_1.default.findById(decoded.userId).select("-password");
            if (!req.user) {
                // If user associated with token doesn't exist anymore
                return res
                    .status(401)
                    .json({ message: "Not authorized, user not found" });
            }
            next(); // Proceed to the next middleware/route handler
        }
        catch (error) {
            console.error("Token verification failed:", error.message);
            // Handle specific JWT errors
            if (error.name === "JsonWebTokenError") {
                return res
                    .status(401)
                    .json({ message: "Not authorized, invalid token" });
            }
            if (error.name === "TokenExpiredError") {
                return res
                    .status(401)
                    .json({ message: "Not authorized, token expired" });
            }
            // Generic error for other issues
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    }
    if (!token) {
        res.status(401).json({ message: "Not authorized, no token provided" });
    }
});
exports.protect = protect;
// Middleware to check for admin role
const admin = (req, res, next) => {
    if (req.user && req.user.role === User_1.UserRole.ADMIN) {
        next(); // User is admin, proceed
    }
    else {
        res.status(403).json({ message: "Not authorized as an admin" }); // Forbidden
    }
};
exports.admin = admin;
