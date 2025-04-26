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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Define possible booking statuses
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "pending";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["CANCELLED"] = "cancelled";
    BookingStatus["COMPLETED"] = "completed";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
const BookingSchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model (to be created)
        required: true,
        index: true,
    },
    room_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Room", // Reference to the Room model
        required: true,
        index: true,
    },
    hotel_id: {
        // Denormalized from Room for easier filtering/aggregation
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps
});
// Validation: Ensure check_out_date is after check_in_date
BookingSchema.pre("validate", function (next) {
    if (this.check_out_date <= this.check_in_date) {
        next(new Error("Check-out date must be after check-in date."));
    }
    else {
        next();
    }
});
// Optional: Compound index for querying bookings by user and status or hotel and status
// BookingSchema.index({ user_id: 1, status: 1 });
// BookingSchema.index({ hotel_id: 1, status: 1 });
// BookingSchema.index({ room_id: 1, check_in_date: 1, check_out_date: 1 }); // For checking room availability conflicts
exports.default = mongoose_1.default.model("Booking", BookingSchema);
