import { Request, Response, NextFunction } from "express";
import Booking, { IBooking, BookingStatus } from "../models/Booking";
import Room, { IRoom } from "../models/Room";
// import User from '../models/User'; // Import User model when created
import mongoose from "mongoose";
import { filterBookingSchema } from "../validators/bookingValidator"; // For validating query params

// Helper function to calculate number of nights
const calculateNights = (checkIn: Date, checkOut: Date): number => {
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1; // Ensure at least 1 night
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (User) - Requires authentication
export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TODO: Get authenticated user ID from req.user (added by auth middleware)
  // const userId = req.user.id; // Example
  const userId = new mongoose.Types.ObjectId(); // Placeholder

  const { room_id, check_in_date, check_out_date } = req.body;

  try {
    // 1. Validate Room ID and Fetch Room
    if (!mongoose.Types.ObjectId.isValid(room_id)) {
      return res.status(400).json({ message: "Invalid Room ID format" });
    }
    const room = await Room.findById(room_id);
    if (!room) {
      return res
        .status(404)
        .json({ message: `Room not found with ID: ${room_id}` });
    }

    // 2. Check Room Availability for the requested dates
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);

    const existingBooking = await Booking.findOne({
      room_id: room._id,
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] }, // Check against confirmed/pending bookings
      $or: [
        // Case 1: Existing booking overlaps start date
        { check_in_date: { $lt: checkOut }, check_out_date: { $gt: checkIn } },
      ],
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "Room is not available for the selected dates.",
        conflictingBookingId: existingBooking._id, // Optional: for debugging/info
      });
    }

    // 3. Calculate Total Price
    const numberOfNights = calculateNights(checkIn, checkOut);
    const totalPrice = room.price * numberOfNights;

    // 4. Create and Save Booking
    const newBooking = new Booking({
      user_id: userId,
      room_id: room._id,
      hotel_id: room.hotel_id, // Denormalized from room
      check_in_date: checkIn,
      check_out_date: checkOut,
      total_price: totalPrice,
      status: BookingStatus.CONFIRMED, // Assume confirmed if available check passes
    });

    const savedBooking = await newBooking.save();

    // Populate details for the response
    await savedBooking.populate([
      { path: "room_id", select: "room_type price" },
      { path: "hotel_id", select: "name location" },
      // { path: 'user_id', select: 'name email' } // Populate user when model exists
    ]);

    // No return here
    res.status(201).json(savedBooking);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res
        .status(400)
        .json({ message: "Validation Error", details: error.errors });
    }
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Server error creating booking" });
    // next(error);
  }
};

// @desc    Get bookings with filtering and pagination
// @route   GET /api/bookings
// @access  Private (User sees own, Admin sees all/filtered)
export const getBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // TODO: Get user ID and role from req.user
    // const userId = req.user.id;
    // const userRole = req.user.role; // e.g., 'user', 'admin'
    const userId = new mongoose.Types.ObjectId(); // Placeholder
    const userRole = "admin"; // Placeholder

    // Validate query parameters
    const { error, value: queryParams } = filterBookingSchema.validate(
      req.query,
      {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: false,
      }
    );

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.path.join("."),
        message: d.message.replace(/['"]/g, ""),
      }));
      return res
        .status(400)
        .json({ message: "Invalid query parameters", errors });
    }

    const {
      page = 1,
      limit = 10,
      status,
      hotel_id,
      room_id,
      check_in_after,
      check_out_before,
      user_id: queryUserId, // Renamed to avoid conflict
    } = queryParams;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};

    // Authorization: Regular users can only see their own bookings
    if (userRole === "user") {
      filter.user_id = userId;
    } else if (userRole === "admin" && queryUserId) {
      // Admin can filter by specific user ID if provided
      if (!mongoose.Types.ObjectId.isValid(queryUserId)) {
        return res
          .status(400)
          .json({ message: "Invalid user_id format in query" });
      }
      filter.user_id = queryUserId;
    }
    // Admins can also filter by hotel_id
    if (userRole === "admin" && hotel_id) {
      if (!mongoose.Types.ObjectId.isValid(hotel_id)) {
        return res
          .status(400)
          .json({ message: "Invalid hotel_id format in query" });
      }
      filter.hotel_id = hotel_id;
    }

    // Other filters
    if (room_id) {
      if (!mongoose.Types.ObjectId.isValid(room_id)) {
        return res
          .status(400)
          .json({ message: "Invalid room_id format in query" });
      }
      filter.room_id = room_id;
    }
    if (status) {
      filter.status = status;
    }
    if (check_in_after) {
      filter.check_in_date = {
        ...filter.check_in_date,
        $gte: new Date(check_in_after),
      };
    }
    if (check_out_before) {
      filter.check_out_date = {
        ...filter.check_out_date,
        $lte: new Date(check_out_before),
      };
    }

    const bookings = await Booking.find(filter)
      .populate("hotel_id", "name location")
      .populate("room_id", "room_type")
      // .populate('user_id', 'name email') // Populate user when model exists
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBookings = await Booking.countDocuments(filter);

    // No return here
    res.status(200).json({
      data: bookings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalBookings / limit),
        totalItems: totalBookings,
        limit: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Server error fetching bookings" });
    // next(error);
  }
};

// @desc    Get a single booking by ID
// @route   GET /api/bookings/:id
// @access  Private (User sees own, Admin sees any)
export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TODO: Get user ID and role from req.user
  // const userId = req.user.id;
  // const userRole = req.user.role;
  const userId = new mongoose.Types.ObjectId(); // Placeholder
  const userRole = "admin"; // Placeholder
  const bookingId = req.params.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid Booking ID format" });
    }

    const booking = await Booking.findById(bookingId)
      .populate("hotel_id", "name location")
      .populate("room_id", "room_type price");
    // .populate('user_id', 'name email'); // Populate user when model exists

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Authorization Check
    // TODO: Uncomment and adjust when auth is ready
    // if (userRole === 'user' && booking.user_id.toString() !== userId.toString()) {
    //     return res.status(403).json({ message: 'Not authorized to view this booking' });
    // }

    // No return here
    res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking by ID:", error);
    res.status(500).json({ message: "Server error fetching booking" });
    // next(error);
  }
};

// @desc    Update a booking status (e.g., cancel)
// @route   PUT /api/bookings/:id
// @access  Private (Admin can update any status, User might cancel own)
export const updateBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TODO: Get user ID and role from req.user
  // const userId = req.user.id;
  // const userRole = req.user.role;
  const userId = new mongoose.Types.ObjectId(); // Placeholder
  const userRole = "admin"; // Placeholder
  const bookingId = req.params.id;
  const { status } = req.body; // Expecting status in the body based on validator

  try {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid Booking ID format" });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Authorization Logic
    // TODO: Implement proper authorization
    // Example: Admin can change to any status. User can only change to CANCELLED if current status is PENDING or CONFIRMED.
    let canUpdate = false;
    if (userRole === "admin") {
      canUpdate = true;
    } else if (
      userRole === "user" &&
      booking.user_id.toString() === userId.toString()
    ) {
      // User can only cancel pending/confirmed bookings
      if (
        status === BookingStatus.CANCELLED &&
        (booking.status === BookingStatus.PENDING ||
          booking.status === BookingStatus.CONFIRMED)
      ) {
        canUpdate = true;
      }
    }

    if (!canUpdate) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this booking status" });
    }

    // Update status
    booking.status = status;
    const updatedBooking = await booking.save();

    await updatedBooking.populate([
      { path: "hotel_id", select: "name location" },
      { path: "room_id", select: "room_type price" },
      // { path: 'user_id', select: 'name email' }
    ]);

    // No return here
    res.status(200).json(updatedBooking);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res
        .status(400)
        .json({ message: "Validation Error", details: error.errors });
    }
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Server error updating booking" });
    // next(error);
  }
};

// @desc    Delete a booking by ID
// @route   DELETE /api/bookings/:id
// @access  Private (Admin, or User for own non-completed booking)
export const deleteBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // TODO: Get user ID and role from req.user
  // const userId = req.user.id;
  // const userRole = req.user.role;
  const userId = new mongoose.Types.ObjectId(); // Placeholder
  const userRole = "admin"; // Placeholder
  const bookingId = req.params.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid Booking ID format" });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Authorization Check
    // TODO: Implement proper authorization
    // Example: Admin can delete any. User can delete own if not 'completed'.
    let canDelete = false;
    if (userRole === "admin") {
      canDelete = true;
    } else if (
      userRole === "user" &&
      booking.user_id.toString() === userId.toString()
    ) {
      if (booking.status !== BookingStatus.COMPLETED) {
        // Prevent deleting completed bookings
        canDelete = true;
      }
    }

    if (!canDelete) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this booking" });
    }

    await Booking.findByIdAndDelete(bookingId);

    // No return here
    res.status(200).json({
      message: "Booking deleted successfully",
      bookingId: booking._id,
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ message: "Server error deleting booking" });
    // next(error);
  }
};
