import mongoose, { Schema, Document, Types } from "mongoose";

// Define an interface for available date ranges
interface IAvailableDateRange {
  startDate: Date;
  endDate: Date;
}

export interface IRoom extends Document {
  room_type: string; // e.g., 'Single', 'Double', 'Suite'
  price: number; // Price per night
  available_dates: IAvailableDateRange[]; // Array of date ranges when the room is available
  hotel_id: Types.ObjectId; // Reference to the Hotel this room belongs to
  createdAt: Date;
  updatedAt: Date;
}

const AvailableDateRangeSchema: Schema = new Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { _id: false } // Don't create separate IDs for subdocuments unless needed
);

// Add validation to ensure endDate is after startDate
AvailableDateRangeSchema.pre<IAvailableDateRange>("validate", function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error("End date must be after start date for available dates."));
  } else {
    next();
  }
});

const RoomSchema: Schema = new Schema(
  {
    room_type: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    available_dates: [AvailableDateRangeSchema],
    hotel_id: {
      type: Schema.Types.ObjectId,
      ref: "Hotel", // Reference to the Hotel model
      required: true,
      index: true, // Index for faster lookups by hotel
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Optional: Add index for available_dates if querying ranges frequently
// RoomSchema.index({ 'available_dates.startDate': 1, 'available_dates.endDate': 1 });

export default mongoose.model<IRoom>("Room", RoomSchema);
