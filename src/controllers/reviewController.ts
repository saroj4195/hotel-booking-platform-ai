import { Request, Response, NextFunction } from "express";
import Review, { IReview } from "../models/Review";
import Hotel from "../models/Hotel"; // To check if hotel exists
import Booking from "../models/Booking"; // Optional: Check if user booked the hotel before reviewing
import mongoose from "mongoose";
import { filterReviewSchema } from "../validators/reviewValidator";

// @desc    Create a new review for a hotel
// @route   POST /api/reviews
// @access  Private (User) - Requires authentication
export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { hotel_id, rating, comment } = req.body;
  const userId = req.user?._id; // Get user ID from authenticated user

  if (!userId) {
    return res.status(401).json({ message: "Not authorized, user ID missing" }); // Should be caught by protect middleware
  }

  try {
    // 1. Check if Hotel exists
    if (!mongoose.Types.ObjectId.isValid(hotel_id)) {
      return res.status(400).json({ message: "Invalid Hotel ID format" });
    }
    const hotelExists = await Hotel.findById(hotel_id);
    if (!hotelExists) {
      return res
        .status(404)
        .json({ message: `Hotel not found with ID: ${hotel_id}` });
    }

    // 2. Optional: Check if the user has actually booked/stayed at the hotel
    // const hasBooked = await Booking.findOne({ user_id: userId, hotel_id: hotel_id, status: 'completed' });
    // if (!hasBooked) {
    //     return res.status(403).json({ message: 'You can only review hotels you have stayed at.' });
    // }

    // 3. Check if user already reviewed this hotel
    const existingReview = await Review.findOne({
      user_id: userId,
      hotel_id: hotel_id,
    });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this hotel" });
    }

    // 4. Create and Save Review
    const newReview = new Review({
      user_id: userId,
      hotel_id,
      rating,
      comment,
    });

    const savedReview = await newReview.save();

    // TODO: Optionally, update the average rating on the Hotel model here or via a post-save hook

    await savedReview.populate("user_id", "name"); // Populate user name

    res.status(201).json(savedReview); // Removed return
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res
        .status(400)
        .json({ message: "Validation Error", details: error.errors });
    }
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Server error creating review" });
    // next(error);
  }
};

// @desc    Get reviews with filtering and pagination
// @route   GET /api/reviews
// @access  Public
export const getReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate query parameters
    const { error, value: queryParams } = filterReviewSchema.validate(
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
      hotel_id,
      user_id,
      min_rating,
      max_rating,
    } = queryParams;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};
    if (hotel_id) {
      if (!mongoose.Types.ObjectId.isValid(hotel_id)) {
        return res
          .status(400)
          .json({ message: "Invalid hotel_id format in query" });
      }
      filter.hotel_id = hotel_id;
    }
    if (user_id) {
      if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res
          .status(400)
          .json({ message: "Invalid user_id format in query" });
      }
      filter.user_id = user_id;
    }
    if (min_rating !== undefined || max_rating !== undefined) {
      filter.rating = {};
      if (min_rating !== undefined) filter.rating.$gte = min_rating;
      if (max_rating !== undefined) filter.rating.$lte = max_rating;
    }

    const reviews = await Review.find(filter)
      .populate("user_id", "name") // Populate user name
      .populate("hotel_id", "name location") // Populate hotel name/location
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalReviews = await Review.countDocuments(filter);

    res.status(200).json({
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalItems: totalReviews,
        limit: limit,
      },
    }); // Removed return
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server error fetching reviews" });
    // next(error);
  }
};

// @desc    Get a single review by ID
// @route   GET /api/reviews/:id
// @access  Public
export const getReviewById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const reviewId = req.params.id;
  try {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid Review ID format" });
    }
    const review = await Review.findById(reviewId)
      .populate("user_id", "name")
      .populate("hotel_id", "name location");

    if (review) {
      res.json(review); // Removed return
    } else {
      res.status(404).json({ message: "Review not found" });
    }
  } catch (error) {
    console.error("Error fetching review by ID:", error);
    res.status(500).json({ message: "Server error fetching review" });
    // next(error);
  }
};

// @desc    Update a review by ID
// @route   PUT /api/reviews/:id
// @access  Private (Owner of the review only)
export const updateReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const reviewId = req.params.id;
  const userId = req.user?._id;
  const { rating, comment } = req.body; // hotel_id cannot be changed

  if (!userId) {
    return res.status(401).json({ message: "Not authorized, user ID missing" });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid Review ID format" });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Authorization: Check if the logged-in user is the owner of the review
    if (review.user_id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "User not authorized to update this review" });
    }

    // Update fields
    review.rating = rating || review.rating;
    // Allow setting comment to empty string, but not removing it if undefined
    if (comment !== undefined) {
      review.comment = comment;
    }

    const updatedReview = await review.save();

    // TODO: Optionally, update the average rating on the Hotel model here or via a post-save hook

    await updatedReview.populate("user_id", "name"); // Populate user name

    res.status(200).json(updatedReview); // Removed return
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res
        .status(400)
        .json({ message: "Validation Error", details: error.errors });
    }
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Server error updating review" });
    // next(error);
  }
};

// @desc    Delete a review by ID
// @route   DELETE /api/reviews/:id
// @access  Private (Owner or Admin)
export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const reviewId = req.params.id;
  const userId = req.user?._id;
  const userRole = req.user?.role;

  if (!userId) {
    return res.status(401).json({ message: "Not authorized, user ID missing" });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid Review ID format" });
    }

    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Authorization: Check if the logged-in user is the owner OR an admin
    if (
      review.user_id.toString() !== userId.toString() &&
      userRole !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "User not authorized to delete this review" });
    }

    await Review.findByIdAndDelete(reviewId);

    // TODO: Optionally, update the average rating on the Hotel model here or via a post-remove hook

    res // Removed return
      .status(200)
      .json({ message: "Review deleted successfully", reviewId: review._id });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Server error deleting review" });
    // next(error);
  }
};
