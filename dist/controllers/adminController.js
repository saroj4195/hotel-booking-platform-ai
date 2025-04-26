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
exports.getDashboardStats = void 0;
const Booking_1 = __importStar(require("../models/Booking"));
const Hotel_1 = __importDefault(require("../models/Hotel"));
// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getDashboardStats = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1. Total Hotels
        const totalHotels = yield Hotel_1.default.countDocuments();
        // 2. Total Bookings (e.g., Confirmed or Completed)
        const totalBookings = yield Booking_1.default.countDocuments({
            status: { $in: [Booking_1.BookingStatus.CONFIRMED, Booking_1.BookingStatus.COMPLETED] },
        });
        // 3. Total Revenue (Sum of total_price for Confirmed/Completed bookings)
        // Note: Assumes 'total_price' is stored on the booking document.
        // If not, you'd need to join with Rooms and calculate based on duration * room.price.
        const revenueResult = yield Booking_1.default.aggregate([
            {
                $match: {
                    status: { $in: [Booking_1.BookingStatus.CONFIRMED, Booking_1.BookingStatus.COMPLETED] },
                },
            },
            {
                $group: {
                    _id: null, // Group all matched documents
                    totalRevenue: { $sum: "$total_price" }, // Sum the total_price field
                },
            },
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
        res.status(200).json({
            totalHotels,
            totalBookings,
            totalRevenue,
            // Add more stats as needed (e.g., new users today, pending bookings)
        }); // Removed return
    }
    catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Server error fetching dashboard stats" });
        // next(error);
    }
});
exports.getDashboardStats = getDashboardStats;
// Add other admin-specific controller functions here later (e.g., coupon management)
