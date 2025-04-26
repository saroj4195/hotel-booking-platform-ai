import mongoose, { Schema, Document, Types } from "mongoose";

export interface IReview extends Document {
  user_id: Types.ObjectId; // Reference to the User who wrote the review
  hotel_id: Types.ObjectId; // Reference to the Hotel being reviewed
  rating: number; // Rating from 1 to 5
  comment?: string; // Optional comment
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    hotel_id: {
      type: Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optional: Prevent a user from reviewing the same hotel multiple times
// ReviewSchema.index({ user_id: 1, hotel_id: 1 }, { unique: true });

// Optional: Calculate average rating on the Hotel model after saving/deleting a review
// ReviewSchema.post('save', async function() { ... update Hotel.rating ... });
// ReviewSchema.post('remove', async function() { ... update Hotel.rating ... });

export default mongoose.model<IReview>("Review", ReviewSchema);
