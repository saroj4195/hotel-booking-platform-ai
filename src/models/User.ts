import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

// Define user roles if needed (e.g., for admin access)
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Make password optional on the interface after hashing/saving
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  // Method to compare entered password with hashed password
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true, // Ensure email is unique
      lowercase: true,
      trim: true,
      match: [/.+\@.+\..+/, "Please fill a valid email address"], // Basic email format validation
    },
    password: { type: String, required: true, select: false }, // select: false prevents password from being returned by default
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to hash password before saving a new user or when password is modified
UserSchema.pre<IUser>("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10); // Generate salt
    this.password = await bcrypt.hash(this.password, salt); // Hash password
    next();
  } catch (error: any) {
    next(error); // Pass error to the next middleware/handler
  }
});

// Method to compare password
UserSchema.methods.matchPassword = async function (
  enteredPassword: string
): Promise<boolean> {
  if (!this.password) return false; // Should not happen if password is required, but good practice
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
