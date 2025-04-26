import { Request, Response, NextFunction } from "express";
import Room, { IRoom } from "../models/Room";
import Hotel from "../models/Hotel"; // To check if hotel exists before creating room
import mongoose from "mongoose";
import { filterRoomSchema } from "../validators/roomValidator"; // For validating query params

// @desc    Create a new room for a hotel
// @route   POST /api/rooms
// @access  Private (Admin)
export const createRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { hotel_id } = req.body;

    // Check if hotel exists
    if (!mongoose.Types.ObjectId.isValid(hotel_id)) {
      return res.status(400).json({ message: "Invalid Hotel ID format" });
    }
    const hotelExists = await Hotel.findById(hotel_id);
    if (!hotelExists) {
      return res
        .status(404)
        .json({ message: `Hotel not found with ID: ${hotel_id}` });
    }

    const newRoom = new Room(req.body);
    const savedRoom = await newRoom.save();
    // Optionally populate hotel details if needed in response
    // await savedRoom.populate('hotel_id', 'name location');
    res.status(201).json(savedRoom); // Removed return
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res
        .status(400)
        .json({ message: "Validation Error", details: error.errors });
    }
    console.error("Error creating room:", error);
    res.status(500).json({ message: "Server error creating room" });
    // next(error);
  }
};

// @desc    Get all rooms with pagination and filtering
// @route   GET /api/rooms
// @access  Public
export const getRooms = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate query parameters using Joi schema
    const { error, value: queryParams } = filterRoomSchema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true, // Allow other query params not defined in schema
      stripUnknown: false, // Keep unknown params if needed elsewhere
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message.replace(/['"]/g, ""),
      }));
      return res
        .status(400)
        .json({ message: "Invalid query parameters", errors });
    }

    const {
      page = 1,
      limit = 10,
      hotel_id,
      available_start,
      available_end,
      min_price,
      max_price,
      room_type,
    } = queryParams;

    const skip = (page - 1) * limit;

    // Build the filter object
    const filter: any = {};
    if (hotel_id) {
      filter.hotel_id = hotel_id;
    }
    if (room_type) {
      filter.room_type = { $regex: room_type, $options: "i" };
    }
    if (min_price !== undefined || max_price !== undefined) {
      filter.price = {};
      if (min_price !== undefined) filter.price.$gte = min_price;
      if (max_price !== undefined) filter.price.$lte = max_price;
    }

    // Date range filtering: Find rooms available for the entire requested period
    if (available_start && available_end) {
      filter.available_dates = {
        $elemMatch: {
          startDate: { $lte: new Date(available_start) },
          endDate: { $gte: new Date(available_end) },
        },
      };
    }

    const rooms = await Room.find(filter)
      .populate("hotel_id", "name location") // Populate hotel details
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalRooms = await Room.countDocuments(filter);

    res.status(200).json({
      data: rooms,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRooms / limit),
        totalItems: totalRooms,
        limit: limit,
      },
    }); // Removed return
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Server error fetching rooms" });
    // next(error);
  }
};

// @desc    Get a single room by ID
// @route   GET /api/rooms/:id
// @access  Public
export const getRoomById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roomId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid Room ID format" });
    }

    const room = await Room.findById(roomId).populate(
      "hotel_id",
      "name location"
    );

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(room); // Removed return
  } catch (error) {
    console.error("Error fetching room by ID:", error);
    res.status(500).json({ message: "Server error fetching room" });
    // next(error);
  }
};

// @desc    Update a room by ID
// @route   PUT /api/rooms/:id
// @access  Private (Admin)
export const updateRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roomId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid Room ID format" });
    }

    // Prevent changing hotel_id if it's not intended
    if (req.body.hotel_id) {
      // Optionally add validation or simply remove it if it shouldn't be updatable
      // delete req.body.hotel_id;
      // Or check if the new hotel_id exists
      if (!mongoose.Types.ObjectId.isValid(req.body.hotel_id)) {
        return res
          .status(400)
          .json({ message: "Invalid Hotel ID format in body" });
      }
      const hotelExists = await Hotel.findById(req.body.hotel_id);
      if (!hotelExists) {
        return res
          .status(404)
          .json({ message: `Hotel not found with ID: ${req.body.hotel_id}` });
      }
    }

    const updatedRoom = await Room.findByIdAndUpdate(roomId, req.body, {
      new: true,
      runValidators: true,
    }).populate("hotel_id", "name location");

    if (!updatedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(updatedRoom); // Removed return
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res
        .status(400)
        .json({ message: "Validation Error", details: error.errors });
    }
    console.error("Error updating room:", error);
    res.status(500).json({ message: "Server error updating room" });
    // next(error);
  }
};

// @desc    Delete a room by ID
// @route   DELETE /api/rooms/:id
// @access  Private (Admin)
export const deleteRoom = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roomId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid Room ID format" });
    }

    const deletedRoom = await Room.findByIdAndDelete(roomId);

    if (!deletedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Optionally, handle related bookings if necessary

    res // Removed return
      .status(200)
      .json({ message: "Room deleted successfully", roomId: deletedRoom._id });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ message: "Server error deleting room" });
    // next(error);
  }
};
