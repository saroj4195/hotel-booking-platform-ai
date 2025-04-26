import { Request, Response, NextFunction } from "express";
import Booking, { BookingStatus } from "../models/Booking";
import Hotel from "../models/Hotel";
import mongoose from "mongoose";

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Total Hotels
    const totalHotels = await Hotel.countDocuments();

    // 2. Total Bookings (e.g., Confirmed or Completed)
    const totalBookings = await Booking.countDocuments({
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
    });

    // 3. Total Revenue (Sum of total_price for Confirmed/Completed bookings)
    // Note: Assumes 'total_price' is stored on the booking document.
    // If not, you'd need to join with Rooms and calculate based on duration * room.price.
    const revenueResult = await Booking.aggregate([
      {
        $match: {
          status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        },
      },
      {
        $group: {
          _id: null, // Group all matched documents
          totalRevenue: { $sum: "$total_price" }, // Sum the total_price field
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.status(200).json({
      totalHotels,
      totalBookings,
      totalRevenue,
      // Add more stats as needed (e.g., new users today, pending bookings)
    }); // Removed return
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Server error fetching dashboard stats" });
    // next(error);
  }
};

// Add other admin-specific controller functions here later (e.g., coupon management)
