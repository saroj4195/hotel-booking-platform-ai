import { Request, Response, NextFunction } from "express";
import Hotel, { IHotel } from "../models/Hotel";
import mongoose from "mongoose";

// @desc    Create a new hotel
// @route   POST /api/hotels
// @access  Private (Admin) - Assuming admin role check middleware will be added later
export const createHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const newHotel = new Hotel(req.body);
    const savedHotel = await newHotel.save();
    res.status(201).json(savedHotel);
  } catch (error) {
    // Basic error handling, more robust handler to be added
    if (error instanceof mongoose.Error.ValidationError) {
      return res
        .status(400)
        .json({ message: "Validation Error", details: error.errors });
    }
    // console.error("Error creating hotel:", error); // Logging handled by central handler
    // res.status(500).json({ message: "Server error creating hotel" });
    next(error); // Pass to central error handler
  }
};

// @desc    Get all hotels with pagination and filtering
// @route   GET /api/hotels
// @access  Public
export const getHotels = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Basic filtering example (can be expanded)
    const filter: any = {};
    if (req.query.location) {
      filter.location = { $regex: req.query.location, $options: "i" }; // Case-insensitive search
    }
    if (req.query.minRating) {
      filter.rating = { $gte: parseFloat(req.query.minRating as string) };
    }

    const hotels = await Hotel.find(filter)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    const totalHotels = await Hotel.countDocuments(filter);

    res.status(200).json({
      data: hotels,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalHotels / limit),
        totalItems: totalHotels,
        limit: limit,
      },
    });
  } catch (error) {
    // console.error("Error fetching hotels:", error);
    // res.status(500).json({ message: "Server error fetching hotels" });
    next(error);
  }
};

// @desc    Get a single hotel by ID
// @route   GET /api/hotels/:id
// @access  Public
export const getHotelById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hotelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({ message: "Invalid Hotel ID format" });
    }

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.status(200).json(hotel);
  } catch (error) {
    // console.error("Error fetching hotel by ID:", error);
    // res.status(500).json({ message: "Server error fetching hotel" });
    next(error);
  }
};

// @desc    Update a hotel by ID
// @route   PUT /api/hotels/:id
// @access  Private (Admin)
export const updateHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hotelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({ message: "Invalid Hotel ID format" });
    }

    const updatedHotel = await Hotel.findByIdAndUpdate(
      hotelId,
      req.body,
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedHotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.status(200).json(updatedHotel);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res
        .status(400)
        .json({ message: "Validation Error", details: error.errors });
    }
    // console.error("Error updating hotel:", error);
    // res.status(500).json({ message: "Server error updating hotel" });
    next(error);
  }
};

// @desc    Delete a hotel by ID
// @route   DELETE /api/hotels/:id
// @access  Private (Admin)
export const deleteHotel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const hotelId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({ message: "Invalid Hotel ID format" });
    }

    const deletedHotel = await Hotel.findByIdAndDelete(hotelId);

    if (!deletedHotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Optionally, could also delete associated rooms, bookings, reviews here or via DB triggers/middleware

    res.status(200).json({
      message: "Hotel deleted successfully",
      hotelId: deletedHotel._id,
    });
  } catch (error) {
    // console.error("Error deleting hotel:", error);
    // res.status(500).json({ message: "Server error deleting hotel" });
    next(error);
  }
};
