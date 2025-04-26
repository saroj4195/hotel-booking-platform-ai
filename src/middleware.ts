import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";

const secretKey = process.env.JWT_SECRET || "your-secret-key";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    (req as any).user = decoded; // Attach user information to the request
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
