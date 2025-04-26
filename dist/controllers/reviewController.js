"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.updateReview = exports.getReviewById = exports.getReviews = exports.createReview = void 0;
const Review_1 = __importDefault(require("../models/Review"));
const Hotel_1 = __importDefault(require("../models/Hotel")); // To check if hotel exists
const mongoose_1 = __importDefault(require("mongoose"));
const reviewValidator_1 = require("../validators/reviewValidator");
// @desc    Create a new review for a hotel
// @route   POST /api/reviews
// @access  Private (User) - Requires authentication
const createReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { hotel_id, rating, comment } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id; // Get user ID from authenticated user
    if (!userId) {
        return res.status(401).json({ message: "Not authorized, user ID missing" }); // Should be caught by protect middleware
    }
    try {
        // 1. Check if Hotel exists
        if (!mongoose_1.default.Types.ObjectId.isValid(hotel_id)) {
            return res.status(400).json({ message: "Invalid Hotel ID format" });
        }
        const hotelExists = yield Hotel_1.default.findById(hotel_id);
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
        const existingReview = yield Review_1.default.findOne({
            user_id: userId,
            hotel_id: hotel_id,
        });
        if (existingReview) {
            return res
                .status(400)
                .json({ message: "You have already reviewed this hotel" });
        }
        // 4. Create and Save Review
        const newReview = new Review_1.default({
            user_id: userId,
            hotel_id,
            rating,
            comment,
        });
        const savedReview = yield newReview.save();
        // TODO: Optionally, update the average rating on the Hotel model here or via a post-save hook
        yield savedReview.populate("user_id", "name"); // Populate user name
        res.status(201).json(savedReview); // Removed return
    }
    catch (error) {
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res
                .status(400)
                .json({ message: "Validation Error", details: error.errors });
        }
        console.error("Error creating review:", error);
        res.status(500).json({ message: "Server error creating review" });
        // next(error);
    }
});
exports.createReview = createReview;
// @desc    Get reviews with filtering and pagination
// @route   GET /api/reviews
// @access  Public
const getReviews = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate query parameters
        const { error, value: queryParams } = reviewValidator_1.filterReviewSchema.validate(req.query, {
            abortEarly: false,
            allowUnknown: true,
            stripUnknown: false,
        });
        if (error) {
            const errors = error.details.map((d) => ({
                field: d.path.join("."),
                message: d.message.replace(/['"]/g, ""),
            }));
            return res
                .status(400)
                .json({ message: "Invalid query parameters", errors });
        }
        const { page = 1, limit = 10, hotel_id, user_id, min_rating, max_rating, } = queryParams;
        const skip = (page - 1) * limit;
        // Build filter object
        const filter = {};
        if (hotel_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(hotel_id)) {
                return res
                    .status(400)
                    .json({ message: "Invalid hotel_id format in query" });
            }
            filter.hotel_id = hotel_id;
        }
        if (user_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(user_id)) {
                return res
                    .status(400)
                    .json({ message: "Invalid user_id format in query" });
            }
            filter.user_id = user_id;
        }
        if (min_rating !== undefined || max_rating !== undefined) {
            filter.rating = {};
            if (min_rating !== undefined)
                filter.rating.$gte = min_rating;
            if (max_rating !== undefined)
                filter.rating.$lte = max_rating;
        }
        const reviews = yield Review_1.default.find(filter)
            .populate("user_id", "name") // Populate user name
            .populate("hotel_id", "name location") // Populate hotel name/location
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const totalReviews = yield Review_1.default.countDocuments(filter);
        res.status(200).json({
            data: reviews,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalReviews / limit),
                totalItems: totalReviews,
                limit: limit,
            },
        }); // Removed return
    }
    catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Server error fetching reviews" });
        // next(error);
    }
});
exports.getReviews = getReviews;
// @desc    Get a single review by ID
// @route   GET /api/reviews/:id
// @access  Public
const getReviewById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const reviewId = req.params.id;
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({ message: "Invalid Review ID format" });
        }
        const review = yield Review_1.default.findById(reviewId)
            .populate("user_id", "name")
            .populate("hotel_id", "name location");
        if (review) {
            res.json(review); // Removed return
        }
        else {
            res.status(404).json({ message: "Review not found" });
        }
    }
    catch (error) {
        console.error("Error fetching review by ID:", error);
        res.status(500).json({ message: "Server error fetching review" });
        // next(error);
    }
});
exports.getReviewById = getReviewById;
// @desc    Update a review by ID
// @route   PUT /api/reviews/:id
// @access  Private (Owner of the review only)
const updateReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const reviewId = req.params.id;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { rating, comment } = req.body; // hotel_id cannot be changed
    if (!userId) {
        return res.status(401).json({ message: "Not authorized, user ID missing" });
    }
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({ message: "Invalid Review ID format" });
        }
        const review = yield Review_1.default.findById(reviewId);
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
        const updatedReview = yield review.save();
        // TODO: Optionally, update the average rating on the Hotel model here or via a post-save hook
        yield updatedReview.populate("user_id", "name"); // Populate user name
        res.status(200).json(updatedReview); // Removed return
    }
    catch (error) {
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res
                .status(400)
                .json({ message: "Validation Error", details: error.errors });
        }
        console.error("Error updating review:", error);
        res.status(500).json({ message: "Server error updating review" });
        // next(error);
    }
});
exports.updateReview = updateReview;
// @desc    Delete a review by ID
// @route   DELETE /api/reviews/:id
// @access  Private (Owner or Admin)
const deleteReview = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const reviewId = req.params.id;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const userRole = (_b = req.user) === null || _b === void 0 ? void 0 : _b.role;
    if (!userId) {
        return res.status(401).json({ message: "Not authorized, user ID missing" });
    }
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({ message: "Invalid Review ID format" });
        }
        const review = yield Review_1.default.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }
        // Authorization: Check if the logged-in user is the owner OR an admin
        if (review.user_id.toString() !== userId.toString() &&
            userRole !== "admin") {
            return res
                .status(403)
                .json({ message: "User not authorized to delete this review" });
        }
        yield Review_1.default.findByIdAndDelete(reviewId);
        // TODO: Optionally, update the average rating on the Hotel model here or via a post-remove hook
        res // Removed return
            .status(200)
            .json({ message: "Review deleted successfully", reviewId: review._id });
    }
    catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: "Server error deleting review" });
        // next(error);
    }
});
exports.deleteReview = deleteReview;
