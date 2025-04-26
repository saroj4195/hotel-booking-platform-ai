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
exports.deleteHotel = exports.updateHotel = exports.getHotelById = exports.getHotels = exports.createHotel = void 0;
const Hotel_1 = __importDefault(require("../models/Hotel"));
const mongoose_1 = __importDefault(require("mongoose"));
// @desc    Create a new hotel
// @route   POST /api/hotels
// @access  Private (Admin) - Assuming admin role check middleware will be added later
const createHotel = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newHotel = new Hotel_1.default(req.body);
        const savedHotel = yield newHotel.save();
        res.status(201).json(savedHotel);
    }
    catch (error) {
        // Basic error handling, more robust handler to be added
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res
                .status(400)
                .json({ message: "Validation Error", details: error.errors });
        }
        // console.error("Error creating hotel:", error); // Logging handled by central handler
        // res.status(500).json({ message: "Server error creating hotel" });
        next(error); // Pass to central error handler
    }
});
exports.createHotel = createHotel;
// @desc    Get all hotels with pagination and filtering
// @route   GET /api/hotels
// @access  Public
const getHotels = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Basic filtering example (can be expanded)
        const filter = {};
        if (req.query.location) {
            filter.location = { $regex: req.query.location, $options: "i" }; // Case-insensitive search
        }
        if (req.query.minRating) {
            filter.rating = { $gte: parseFloat(req.query.minRating) };
        }
        const hotels = yield Hotel_1.default.find(filter)
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit);
        const totalHotels = yield Hotel_1.default.countDocuments(filter);
        res.status(200).json({
            data: hotels,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalHotels / limit),
                totalItems: totalHotels,
                limit: limit,
            },
        });
    }
    catch (error) {
        // console.error("Error fetching hotels:", error);
        // res.status(500).json({ message: "Server error fetching hotels" });
        next(error);
    }
});
exports.getHotels = getHotels;
// @desc    Get a single hotel by ID
// @route   GET /api/hotels/:id
// @access  Public
const getHotelById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotelId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({ message: "Invalid Hotel ID format" });
        }
        const hotel = yield Hotel_1.default.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        res.status(200).json(hotel);
    }
    catch (error) {
        // console.error("Error fetching hotel by ID:", error);
        // res.status(500).json({ message: "Server error fetching hotel" });
        next(error);
    }
});
exports.getHotelById = getHotelById;
// @desc    Update a hotel by ID
// @route   PUT /api/hotels/:id
// @access  Private (Admin)
const updateHotel = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotelId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({ message: "Invalid Hotel ID format" });
        }
        const updatedHotel = yield Hotel_1.default.findByIdAndUpdate(hotelId, req.body, { new: true, runValidators: true } // Return the updated document and run schema validators
        );
        if (!updatedHotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        res.status(200).json(updatedHotel);
    }
    catch (error) {
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res
                .status(400)
                .json({ message: "Validation Error", details: error.errors });
        }
        // console.error("Error updating hotel:", error);
        // res.status(500).json({ message: "Server error updating hotel" });
        next(error);
    }
});
exports.updateHotel = updateHotel;
// @desc    Delete a hotel by ID
// @route   DELETE /api/hotels/:id
// @access  Private (Admin)
const deleteHotel = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotelId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(hotelId)) {
            return res.status(400).json({ message: "Invalid Hotel ID format" });
        }
        const deletedHotel = yield Hotel_1.default.findByIdAndDelete(hotelId);
        if (!deletedHotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        // Optionally, could also delete associated rooms, bookings, reviews here or via DB triggers/middleware
        res.status(200).json({
            message: "Hotel deleted successfully",
            hotelId: deletedHotel._id,
        });
    }
    catch (error) {
        // console.error("Error deleting hotel:", error);
        // res.status(500).json({ message: "Server error deleting hotel" });
        next(error);
    }
});
exports.deleteHotel = deleteHotel;
