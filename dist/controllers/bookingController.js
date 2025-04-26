"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.deleteBooking = exports.updateBooking = exports.getBookingById = exports.getBookings = exports.createBooking = void 0;
const Booking_1 = __importStar(require("../models/Booking"));
const Room_1 = __importDefault(require("../models/Room"));
// import User from '../models/User'; // Import User model when created
const mongoose_1 = __importDefault(require("mongoose"));
const bookingValidator_1 = require("../validators/bookingValidator"); // For validating query params
// Helper function to calculate number of nights
const calculateNights = (checkIn, checkOut) => {
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1; // Ensure at least 1 night
};
// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (User) - Requires authentication
const createBooking = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Get authenticated user ID from req.user (added by auth middleware)
    // const userId = req.user.id; // Example
    const userId = new mongoose_1.default.Types.ObjectId(); // Placeholder
    const { room_id, check_in_date, check_out_date } = req.body;
    try {
        // 1. Validate Room ID and Fetch Room
        if (!mongoose_1.default.Types.ObjectId.isValid(room_id)) {
            return res.status(400).json({ message: "Invalid Room ID format" });
        }
        const room = yield Room_1.default.findById(room_id);
        if (!room) {
            return res
                .status(404)
                .json({ message: `Room not found with ID: ${room_id}` });
        }
        // 2. Check Room Availability for the requested dates
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);
        const existingBooking = yield Booking_1.default.findOne({
            room_id: room._id,
            status: { $in: [Booking_1.BookingStatus.CONFIRMED, Booking_1.BookingStatus.PENDING] }, // Check against confirmed/pending bookings
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
        const newBooking = new Booking_1.default({
            user_id: userId,
            room_id: room._id,
            hotel_id: room.hotel_id, // Denormalized from room
            check_in_date: checkIn,
            check_out_date: checkOut,
            total_price: totalPrice,
            status: Booking_1.BookingStatus.CONFIRMED, // Assume confirmed if available check passes
        });
        const savedBooking = yield newBooking.save();
        // Populate details for the response
        yield savedBooking.populate([
            { path: "room_id", select: "room_type price" },
            { path: "hotel_id", select: "name location" },
            // { path: 'user_id', select: 'name email' } // Populate user when model exists
        ]);
        // No return here
        res.status(201).json(savedBooking);
    }
    catch (error) {
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res
                .status(400)
                .json({ message: "Validation Error", details: error.errors });
        }
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Server error creating booking" });
        // next(error);
    }
});
exports.createBooking = createBooking;
// @desc    Get bookings with filtering and pagination
// @route   GET /api/bookings
// @access  Private (User sees own, Admin sees all/filtered)
const getBookings = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // TODO: Get user ID and role from req.user
        // const userId = req.user.id;
        // const userRole = req.user.role; // e.g., 'user', 'admin'
        const userId = new mongoose_1.default.Types.ObjectId(); // Placeholder
        const userRole = "admin"; // Placeholder
        // Validate query parameters
        const { error, value: queryParams } = bookingValidator_1.filterBookingSchema.validate(req.query, {
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
        const { page = 1, limit = 10, status, hotel_id, room_id, check_in_after, check_out_before, user_id: queryUserId, // Renamed to avoid conflict
         } = queryParams;
        const skip = (page - 1) * limit;
        // Build filter object
        const filter = {};
        // Authorization: Regular users can only see their own bookings
        if (userRole === "user") {
            filter.user_id = userId;
        }
        else if (userRole === "admin" && queryUserId) {
            // Admin can filter by specific user ID if provided
            if (!mongoose_1.default.Types.ObjectId.isValid(queryUserId)) {
                return res
                    .status(400)
                    .json({ message: "Invalid user_id format in query" });
            }
            filter.user_id = queryUserId;
        }
        // Admins can also filter by hotel_id
        if (userRole === "admin" && hotel_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(hotel_id)) {
                return res
                    .status(400)
                    .json({ message: "Invalid hotel_id format in query" });
            }
            filter.hotel_id = hotel_id;
        }
        // Other filters
        if (room_id) {
            if (!mongoose_1.default.Types.ObjectId.isValid(room_id)) {
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
            filter.check_in_date = Object.assign(Object.assign({}, filter.check_in_date), { $gte: new Date(check_in_after) });
        }
        if (check_out_before) {
            filter.check_out_date = Object.assign(Object.assign({}, filter.check_out_date), { $lte: new Date(check_out_before) });
        }
        const bookings = yield Booking_1.default.find(filter)
            .populate("hotel_id", "name location")
            .populate("room_id", "room_type")
            // .populate('user_id', 'name email') // Populate user when model exists
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const totalBookings = yield Booking_1.default.countDocuments(filter);
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
    }
    catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Server error fetching bookings" });
        // next(error);
    }
});
exports.getBookings = getBookings;
// @desc    Get a single booking by ID
// @route   GET /api/bookings/:id
// @access  Private (User sees own, Admin sees any)
const getBookingById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Get user ID and role from req.user
    // const userId = req.user.id;
    // const userRole = req.user.role;
    const userId = new mongoose_1.default.Types.ObjectId(); // Placeholder
    const userRole = "admin"; // Placeholder
    const bookingId = req.params.id;
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: "Invalid Booking ID format" });
        }
        const booking = yield Booking_1.default.findById(bookingId)
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
    }
    catch (error) {
        console.error("Error fetching booking by ID:", error);
        res.status(500).json({ message: "Server error fetching booking" });
        // next(error);
    }
});
exports.getBookingById = getBookingById;
// @desc    Update a booking status (e.g., cancel)
// @route   PUT /api/bookings/:id
// @access  Private (Admin can update any status, User might cancel own)
const updateBooking = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Get user ID and role from req.user
    // const userId = req.user.id;
    // const userRole = req.user.role;
    const userId = new mongoose_1.default.Types.ObjectId(); // Placeholder
    const userRole = "admin"; // Placeholder
    const bookingId = req.params.id;
    const { status } = req.body; // Expecting status in the body based on validator
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: "Invalid Booking ID format" });
        }
        const booking = yield Booking_1.default.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        // Authorization Logic
        // TODO: Implement proper authorization
        // Example: Admin can change to any status. User can only change to CANCELLED if current status is PENDING or CONFIRMED.
        let canUpdate = false;
        if (userRole === "admin") {
            canUpdate = true;
        }
        else if (userRole === "user" &&
            booking.user_id.toString() === userId.toString()) {
            // User can only cancel pending/confirmed bookings
            if (status === Booking_1.BookingStatus.CANCELLED &&
                (booking.status === Booking_1.BookingStatus.PENDING ||
                    booking.status === Booking_1.BookingStatus.CONFIRMED)) {
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
        const updatedBooking = yield booking.save();
        yield updatedBooking.populate([
            { path: "hotel_id", select: "name location" },
            { path: "room_id", select: "room_type price" },
            // { path: 'user_id', select: 'name email' }
        ]);
        // No return here
        res.status(200).json(updatedBooking);
    }
    catch (error) {
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res
                .status(400)
                .json({ message: "Validation Error", details: error.errors });
        }
        console.error("Error updating booking:", error);
        res.status(500).json({ message: "Server error updating booking" });
        // next(error);
    }
});
exports.updateBooking = updateBooking;
// @desc    Delete a booking by ID
// @route   DELETE /api/bookings/:id
// @access  Private (Admin, or User for own non-completed booking)
const deleteBooking = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Get user ID and role from req.user
    // const userId = req.user.id;
    // const userRole = req.user.role;
    const userId = new mongoose_1.default.Types.ObjectId(); // Placeholder
    const userRole = "admin"; // Placeholder
    const bookingId = req.params.id;
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: "Invalid Booking ID format" });
        }
        const booking = yield Booking_1.default.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        // Authorization Check
        // TODO: Implement proper authorization
        // Example: Admin can delete any. User can delete own if not 'completed'.
        let canDelete = false;
        if (userRole === "admin") {
            canDelete = true;
        }
        else if (userRole === "user" &&
            booking.user_id.toString() === userId.toString()) {
            if (booking.status !== Booking_1.BookingStatus.COMPLETED) {
                // Prevent deleting completed bookings
                canDelete = true;
            }
        }
        if (!canDelete) {
            return res
                .status(403)
                .json({ message: "Not authorized to delete this booking" });
        }
        yield Booking_1.default.findByIdAndDelete(bookingId);
        // No return here
        res.status(200).json({
            message: "Booking deleted successfully",
            bookingId: booking._id,
        });
    }
    catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({ message: "Server error deleting booking" });
        // next(error);
    }
});
exports.deleteBooking = deleteBooking;
