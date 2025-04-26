import mongoose, { Schema, Document } from "mongoose";

export interface IHotel extends Document {
  name: string;
  location: string;
  description: string;
  photos: string[];
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const HotelSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    photos: [{ type: String }], // Array of photo URLs
    rating: { type: Number, min: 0, max: 5, default: 0 },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

export default mongoose.model<IHotel>("Hotel", HotelSchema);
