import { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/User";
import generateToken from "../utils/generateToken";
import mongoose from "mongoose";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Create new user (password hashing handled by pre-save middleware in User model)
    const user = new User({
      name,
      email,
      password,
      // Role defaults to 'user' as defined in the model
    });

    const savedUser = await user.save();

    // Don't send password back, even hashed (it's selected: false anyway)
    const userResponse = {
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
      // Cast _id to ObjectId before passing to generateToken
      token: generateToken(
        savedUser._id as mongoose.Types.ObjectId,
        savedUser.role
      ),
    };

    res.status(201).json(userResponse); // Removed return
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res
        .status(400)
        .json({ message: "Validation Error", details: error.errors });
    }
    // Handle potential duplicate key error (email) more specifically if needed
    if ((error as any).code === 11000) {
      return res.status(400).json({ message: "Email already registered" });
    }
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Server error registering user" });
    // next(error);
  }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;

  try {
    // Find user by email, explicitly select password which is normally excluded
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" }); // Generic message
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" }); // Generic message
    }

    // Password matched, generate token and send response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Cast _id to ObjectId before passing to generateToken
      token: generateToken(user._id as mongoose.Types.ObjectId, user.role),
    };

    res.status(200).json(userResponse); // Removed return
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Server error logging in" });
    // next(error);
  }
};
