import mongoose, { Schema, Document, Types } from "mongoose";

// Define possible booking statuses
export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed", // Optional: for past bookings
}

export interface IBooking extends Document {
  user_id: Types.ObjectId; // Reference to the User who made the booking
  room_id: Types.ObjectId; // Reference to the Room being booked
  hotel_id: Types.ObjectId; // Reference to the Hotel (denormalized for easier queries)
  check_in_date: Date;
  check_out_date: Date;
  status: BookingStatus;
  total_price?: number; // Optional: Calculated price based on room price and duration
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User", // Reference to the User model (to be created)
      required: true,
      index: true,
    },
    room_id: {
      type: Schema.Types.ObjectId,
      ref: "Room", // Reference to the Room model
      required: true,
      index: true,
    },
    hotel_id: {
      // Denormalized from Room for easier filtering/aggregation
      type: Schema.Types.ObjectId,
      ref: "Hotel", // Reference to the Hotel model
      required: true,
      index: true,
    },
    check_in_date: { type: Date, required: true },
    check_out_date: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
      required: true,
      index: true,
    },
    total_price: { type: Number }, // Can be calculated on creation or fetched dynamically
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Validation: Ensure check_out_date is after check_in_date
BookingSchema.pre<IBooking>("validate", function (next) {
  if (this.check_out_date <= this.check_in_date) {
    next(new Error("Check-out date must be after check-in date."));
  } else {
    next();
  }
});

// Optional: Compound index for querying bookings by user and status or hotel and status
// BookingSchema.index({ user_id: 1, status: 1 });
// BookingSchema.index({ hotel_id: 1, status: 1 });
// BookingSchema.index({ room_id: 1, check_in_date: 1, check_out_date: 1 }); // For checking room availability conflicts

export default mongoose.model<IBooking>("Booking", BookingSchema);
