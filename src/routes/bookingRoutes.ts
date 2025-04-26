import express from "express";
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} from "../controllers/bookingController";
import {
  createBookingSchema,
  updateBookingSchema,
} from "../validators/bookingValidator";
import { validateRequest } from "../middleware/validateRequest";
// import { protect, admin } from '../middleware/authMiddleware'; // Import auth middleware later

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d0fe4f5311236168a109cc
 *         user_id:
 *           type: string # Or $ref: '#/components/schemas/User'
 *           description: ID of the user who made the booking
 *           example: 60d0fe4f5311236168a109cd
 *         room_id:
 *           type: string # Or $ref: '#/components/schemas/Room'
 *           description: ID of the booked room
 *           example: 60d0fe4f5311236168a109cb
 *         hotel_id:
 *           type: string # Or $ref: '#/components/schemas/Hotel'
 *           description: ID of the hotel (denormalized)
 *           example: 60d0fe4f5311236168a109ca
 *         check_in_date:
 *           type: string
 *           format: date-time
 *           description: Check-in date
 *           example: "2024-12-20T00:00:00.000Z"
 *         check_out_date:
 *           type: string
 *           format: date-time
 *           description: Check-out date
 *           example: "2024-12-25T00:00:00.000Z"
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *           description: Status of the booking
 *           example: confirmed
 *         total_price:
 *           type: number
 *           format: float
 *           description: Calculated total price for the stay
 *           example: 550.75
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *     BookingInput:
 *       type: object
 *       required:
 *         - room_id
 *         - check_in_date
 *         - check_out_date
 *       properties:
 *         room_id:
 *           type: string
 *           description: ID of the room to book
 *           example: 60d0fe4f5311236168a109cb
 *         check_in_date:
 *           type: string
 *           format: date # Use date format for input simplicity if ISO time isn't needed
 *           description: Desired check-in date (YYYY-MM-DD)
 *           example: "2024-12-20"
 *         check_out_date:
 *           type: string
 *           format: date
 *           description: Desired check-out date (YYYY-MM-DD)
 *           example: "2024-12-25"
 *     BookingUpdateInput:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *           description: The new status for the booking
 *           example: cancelled
 *   parameters:
 *     bookingIdParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: The ID of the booking
 *       example: 60d0fe4f5311236168a109cc
 *     filterBookingUserId:
 *       in: query
 *       name: user_id
 *       schema:
 *         type: string
 *       description: Filter bookings by User ID (Admin only)
 *       example: 60d0fe4f5311236168a109cd
 *     filterBookingHotelId:
 *       in: query
 *       name: hotel_id
 *       schema:
 *         type: string
 *       description: Filter bookings by Hotel ID (Admin only)
 *       example: 60d0fe4f5311236168a109ca
 *     filterBookingRoomId:
 *       in: query
 *       name: room_id
 *       schema:
 *         type: string
 *       description: Filter bookings by Room ID
 *     filterBookingStatus:
 *       in: query
 *       name: status
 *       schema:
 *         type: string
 *         enum: [pending, confirmed, cancelled, completed]
 *       description: Filter bookings by status
 *     filterBookingCheckInAfter:
 *       in: query
 *       name: check_in_after
 *       schema:
 *         type: string
 *         format: date
 *       description: Filter bookings checking in on or after this date (YYYY-MM-DD)
 *     filterBookingCheckOutBefore:
 *       in: query
 *       name: check_out_before
 *       schema:
 *         type: string
 *         format: date
 *       description: Filter bookings checking out on or before this date (YYYY-MM-DD)
 */

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Retrieve a list of bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: [] # Requires JWT token
 *     parameters:
 *       - $ref: '#/components/parameters/paginationPage'
 *       - $ref: '#/components/parameters/paginationLimit'
 *       - $ref: '#/components/parameters/filterBookingUserId'
 *       - $ref: '#/components/parameters/filterBookingHotelId'
 *       - $ref: '#/components/parameters/filterBookingRoomId'
 *       - $ref: '#/components/parameters/filterBookingStatus'
 *       - $ref: '#/components/parameters/filterBookingCheckInAfter'
 *       - $ref: '#/components/parameters/filterBookingCheckOutBefore'
 *     responses:
 *       200:
 *         description: A list of bookings. Regular users see only their own. Admins can filter.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Add protect middleware later: router.get('/', protect, getBookings);
router.get("/", getBookings); // Query validation happens inside controller

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: [] # Requires JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingInput'
 *     responses:
 *       201:
 *         description: Booking created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid input data, Room not available, or ID format error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
// Add protect middleware later: router.post('/', protect, validateRequest(createBookingSchema), createBooking);
router.post("/", validateRequest(createBookingSchema), createBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get a booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: [] # Requires JWT token
 *     parameters:
 *       - $ref: '#/components/parameters/bookingIdParam'
 *     responses:
 *       200:
 *         description: Booking data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User trying to access another user's booking)
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
// Add protect middleware later: router.get('/:id', protect, getBookingById);
router.get("/:id", getBookingById);

/**
 * @swagger
 * /bookings/{id}:
 *   put:
 *     summary: Update a booking status
 *     description: Allows updating the status of a booking (e.g., cancelling). Admins have more privileges than regular users.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: [] # Requires JWT token
 *     parameters:
 *       - $ref: '#/components/parameters/bookingIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingUpdateInput'
 *     responses:
 *       200:
 *         description: Booking status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid input data or ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User not authorized to update this booking or status)
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
// Add protect middleware later: router.put('/:id', protect, validateRequest(updateBookingSchema), updateBooking);
router.put("/:id", validateRequest(updateBookingSchema), updateBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Delete a booking by ID
 *     description: Allows deleting a booking. Admins can delete any, users can delete their own non-completed bookings.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: [] # Requires JWT token
 *     parameters:
 *       - $ref: '#/components/parameters/bookingIdParam'
 *     responses:
 *       200:
 *         description: Booking deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Booking deleted successfully
 *                 bookingId:
 *                    type: string
 *                    example: 60d0fe4f5311236168a109cc
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User not authorized to delete this booking)
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Server error
 */
// Add protect middleware later: router.delete('/:id', protect, deleteBooking);
router.delete("/:id", deleteBooking);

export default router;
