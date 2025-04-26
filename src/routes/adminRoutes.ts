import express from "express";
import { getDashboardStats } from "../controllers/adminController";
// Import other admin controllers later (e.g., manageBookings, manageCoupons)
import { protect, admin } from "../middleware/authMiddleware"; // Requires admin access

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-specific operations (Dashboard, Management)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardStats:
 *       type: object
 *       properties:
 *         totalHotels:
 *           type: integer
 *           description: Total number of hotels in the system.
 *           example: 50
 *         totalBookings:
 *           type: integer
 *           description: Total number of confirmed or completed bookings.
 *           example: 1250
 *         totalRevenue:
 *           type: number
 *           format: float
 *           description: Estimated total revenue from confirmed/completed bookings.
 *           example: 150350.75
 */

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get dashboard statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStats'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User is not an admin)
 *       500:
 *         description: Server error
 */
router.get("/stats", protect, admin, getDashboardStats);

// Add other admin routes here later:
// - Manage Bookings (e.g., GET /admin/bookings, PUT /admin/bookings/:id/status) - Could reuse/extend bookingRoutes with admin checks
// - Manage Coupons (e.g., POST /admin/coupons, GET /admin/coupons)

export default router;
