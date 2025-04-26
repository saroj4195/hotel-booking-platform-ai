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
exports.deleteRoom = exports.updateRoom = exports.getRoomById = exports.getRooms = exports.createRoom = void 0;
const Room_1 = __importDefault(require("../models/Room"));
const Hotel_1 = __importDefault(require("../models/Hotel")); // To check if hotel exists before creating room
const mongoose_1 = __importDefault(require("mongoose"));
const roomValidator_1 = require("../validators/roomValidator"); // For validating query params
// @desc    Create a new room for a hotel
// @route   POST /api/rooms
// @access  Private (Admin)
const createRoom = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hotel_id } = req.body;
        // Check if hotel exists
        if (!mongoose_1.default.Types.ObjectId.isValid(hotel_id)) {
            return res.status(400).json({ message: "Invalid Hotel ID format" });
        }
        const hotelExists = yield Hotel_1.default.findById(hotel_id);
        if (!hotelExists) {
            return res
                .status(404)
                .json({ message: `Hotel not found with ID: ${hotel_id}` });
        }
        const newRoom = new Room_1.default(req.body);
        const savedRoom = yield newRoom.save();
        // Optionally populate hotel details if needed in response
        // await savedRoom.populate('hotel_id', 'name location');
        res.status(201).json(savedRoom); // Removed return
    }
    catch (error) {
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res
                .status(400)
                .json({ message: "Validation Error", details: error.errors });
        }
        console.error("Error creating room:", error);
        res.status(500).json({ message: "Server error creating room" });
        // next(error);
    }
});
exports.createRoom = createRoom;
// @desc    Get all rooms with pagination and filtering
// @route   GET /api/rooms
// @access  Public
const getRooms = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate query parameters using Joi schema
        const { error, value: queryParams } = roomValidator_1.filterRoomSchema.validate(req.query, {
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
        const { page = 1, limit = 10, hotel_id, available_start, available_end, min_price, max_price, room_type, } = queryParams;
        const skip = (page - 1) * limit;
        // Build the filter object
        const filter = {};
        if (hotel_id) {
            filter.hotel_id = hotel_id;
        }
        if (room_type) {
            filter.room_type = { $regex: room_type, $options: "i" };
        }
        if (min_price !== undefined || max_price !== undefined) {
            filter.price = {};
            if (min_price !== undefined)
                filter.price.$gte = min_price;
            if (max_price !== undefined)
                filter.price.$lte = max_price;
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
        const rooms = yield Room_1.default.find(filter)
            .populate("hotel_id", "name location") // Populate hotel details
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const totalRooms = yield Room_1.default.countDocuments(filter);
        res.status(200).json({
            data: rooms,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalRooms / limit),
                totalItems: totalRooms,
                limit: limit,
            },
        }); // Removed return
    }
    catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).json({ message: "Server error fetching rooms" });
        // next(error);
    }
});
exports.getRooms = getRooms;
// @desc    Get a single room by ID
// @route   GET /api/rooms/:id
// @access  Public
const getRoomById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({ message: "Invalid Room ID format" });
        }
        const room = yield Room_1.default.findById(roomId).populate("hotel_id", "name location");
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.status(200).json(room); // Removed return
    }
    catch (error) {
        console.error("Error fetching room by ID:", error);
        res.status(500).json({ message: "Server error fetching room" });
        // next(error);
    }
});
exports.getRoomById = getRoomById;
// @desc    Update a room by ID
// @route   PUT /api/rooms/:id
// @access  Private (Admin)
const updateRoom = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({ message: "Invalid Room ID format" });
        }
        // Prevent changing hotel_id if it's not intended
        if (req.body.hotel_id) {
            // Optionally add validation or simply remove it if it shouldn't be updatable
            // delete req.body.hotel_id;
            // Or check if the new hotel_id exists
            if (!mongoose_1.default.Types.ObjectId.isValid(req.body.hotel_id)) {
                return res
                    .status(400)
                    .json({ message: "Invalid Hotel ID format in body" });
            }
            const hotelExists = yield Hotel_1.default.findById(req.body.hotel_id);
            if (!hotelExists) {
                return res
                    .status(404)
                    .json({ message: `Hotel not found with ID: ${req.body.hotel_id}` });
            }
        }
        const updatedRoom = yield Room_1.default.findByIdAndUpdate(roomId, req.body, {
            new: true,
            runValidators: true,
        }).populate("hotel_id", "name location");
        if (!updatedRoom) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.status(200).json(updatedRoom); // Removed return
    }
    catch (error) {
        if (error instanceof mongoose_1.default.Error.ValidationError) {
            return res
                .status(400)
                .json({ message: "Validation Error", details: error.errors });
        }
        console.error("Error updating room:", error);
        res.status(500).json({ message: "Server error updating room" });
        // next(error);
    }
});
exports.updateRoom = updateRoom;
// @desc    Delete a room by ID
// @route   DELETE /api/rooms/:id
// @access  Private (Admin)
const deleteRoom = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roomId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({ message: "Invalid Room ID format" });
        }
        const deletedRoom = yield Room_1.default.findByIdAndDelete(roomId);
        if (!deletedRoom) {
            return res.status(404).json({ message: "Room not found" });
        }
        // Optionally, handle related bookings if necessary
        res // Removed return
            .status(200)
            .json({ message: "Room deleted successfully", roomId: deletedRoom._id });
    }
    catch (error) {
        console.error("Error deleting room:", error);
        res.status(500).json({ message: "Server error deleting room" });
        // next(error);
    }
});
exports.deleteRoom = deleteRoom;
