import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { IUser, UserRole } from "../models/User";
import mongoose from "mongoose";

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: IUser; // Add user property to Request object
    }
  }
}

interface DecodedToken extends JwtPayload {
  userId: string;
  role: UserRole;
}

// Middleware to protect routes - verifies JWT token
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;

  // Check for token in Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error("JWT_SECRET is not defined.");
        return res.status(500).json({ message: "Server configuration error" });
      }

      const decoded = jwt.verify(token, secret) as DecodedToken;

      // Validate the decoded payload structure
      if (
        !decoded ||
        typeof decoded !== "object" ||
        !decoded.userId ||
        !decoded.role
      ) {
        throw new Error("Invalid token payload");
      }

      // Check if userId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(decoded.userId)) {
        throw new Error("Invalid user ID in token");
      }

      // Get user from the token payload (excluding password)
      req.user = await User.findById(decoded.userId).select("-password");

      if (!req.user) {
        // If user associated with token doesn't exist anymore
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      next(); // Proceed to the next middleware/route handler
    } catch (error: any) {
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
};

// Middleware to check for admin role
export const admin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === UserRole.ADMIN) {
    next(); // User is admin, proceed
  } else {
    res.status(403).json({ message: "Not authorized as an admin" }); // Forbidden
  }
};
