import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Function to generate JWT token
const generateToken = (
  userId: mongoose.Types.ObjectId,
  userRole: string
): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is not defined in environment variables.");
    throw new Error("Server configuration error: JWT secret missing.");
    // In a real app, you might want to handle this more gracefully or prevent server start
  }

  // Create payload for the token
  const payload = {
    userId: userId.toString(), // Convert ObjectId to string
    role: userRole,
    // Add other relevant non-sensitive info if needed (e.g., name)
  };

  // Sign the token with the secret and set expiration (e.g., 1 day)
  const token = jwt.sign(payload, secret, {
    expiresIn: "1d", // Token expires in 1 day (adjust as needed, e.g., '1h', '30m')
  });

  return token;
};

export default generateToken;
