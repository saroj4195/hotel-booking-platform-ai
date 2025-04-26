import express from "express";
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
} from "../controllers/roomController";
import {
  createRoomSchema,
  updateRoomSchema,
} from "../validators/roomValidator";
import { validateRequest } from "../middleware/validateRequest";
import { protect, admin } from "../middleware/authMiddleware"; // Import auth middleware
import asyncHandler from "express-async-handler"; // Use library

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: Room management and retrieval
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AvailableDateRange:
 *       type: object
 *       properties:
 *         startDate:
 *           type: string
 *           format: date
 *           description: Start date of availability range
 *           example: "2024-12-01"
 *         endDate:
 *           type: string
 *           format: date
 *           description: End date of availability range
 *           example: "2024-12-15"
 *     Room:
 *       type: object
 *       required:
 *         - room_type
 *         - price
 *         - hotel_id
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the room
 *           example: 60d0fe4f5311236168a109cb
 *         room_type:
 *           type: string
 *           description: Type of the room (e.g., Single, Double, Suite)
 *           example: Suite
 *         price:
 *           type: number
 *           format: float
 *           description: Price per night
 *           example: 250.50
 *         available_dates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AvailableDateRange'
 *           description: Array of date ranges when the room is available
 *         hotel_id:
 *           type: string # Or reference Hotel schema $ref: '#/components/schemas/Hotel'
 *           description: ID of the hotel this room belongs to
 *           example: 60d0fe4f5311236168a109ca
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *     RoomInput:
 *       type: object
 *       required:
 *         - room_type
 *         - price
 *         - hotel_id
 *       properties:
 *         room_type:
 *           type: string
 *           example: Double
 *         price:
 *           type: number
 *           format: float
 *           example: 120.00
 *         available_dates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AvailableDateRange'
 *           example: [{ "startDate": "2025-01-01", "endDate": "2025-01-31" }]
 *         hotel_id:
 *           type: string
 *           description: ID of the associated hotel
 *           example: 60d0fe4f5311236168a109ca
 *   parameters:
 *     roomIdParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: The ID of the room
 *       example: 60d0fe4f5311236168a109cb
 *     filterRoomHotelId:
 *       in: query
 *       name: hotel_id
 *       schema:
 *         type: string
 *       description: Filter rooms by Hotel ID
 *       example: 60d0fe4f5311236168a109ca
 *     filterRoomAvailableStart:
 *       in: query
 *       name: available_start
 *       schema:
 *         type: string
 *         format: date
 *       description: Filter rooms available from this date (inclusive). Requires available_end.
 *       example: "2024-12-10"
 *     filterRoomAvailableEnd:
 *       in: query
 *       name: available_end
 *       schema:
 *         type: string
 *         format: date
 *       description: Filter rooms available up to this date (inclusive). Requires available_start.
 *       example: "2024-12-20"
 *     filterRoomMinPrice:
 *        in: query
 *        name: min_price
 *        schema:
 *          type: number
 *          format: float
 *        description: Filter rooms with price greater than or equal to this value.
 *     filterRoomMaxPrice:
 *        in: query
 *        name: max_price
 *        schema:
 *          type: number
 *          format: float
 *        description: Filter rooms with price less than or equal to this value.
 *     filterRoomType:
 *        in: query
 *        name: room_type
 *        schema:
 *          type: string
 *        description: Filter rooms by type (case-insensitive search).
 */

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Retrieve a list of rooms with filtering and pagination
 *     tags: [Rooms]
 *     parameters:
 *       - $ref: '#/components/parameters/paginationPage'
 *       - $ref: '#/components/parameters/paginationLimit'
 *       - $ref: '#/components/parameters/filterRoomHotelId'
 *       - $ref: '#/components/parameters/filterRoomAvailableStart'
 *       - $ref: '#/components/parameters/filterRoomAvailableEnd'
 *       - $ref: '#/components/parameters/filterRoomMinPrice'
 *       - $ref: '#/components/parameters/filterRoomMaxPrice'
 *       - $ref: '#/components/parameters/filterRoomType'
 *     responses:
 *       200:
 *         description: A list of rooms.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Room'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination' # Assuming a global Pagination schema exists or define here
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */
router.get("/", asyncHandler(getRooms)); // Wrapped with asyncHandler

/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: [] # Requires JWT token (Admin role)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoomInput'
 *     responses:
 *       201:
 *         description: Room created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       400:
 *         description: Invalid input data or Hotel ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  protect, // Added protect
  admin, // Added admin
  validateRequest(createRoomSchema),
  asyncHandler(createRoom) // Wrapped with asyncHandler
);

/**
 * @swagger
 * /rooms/{id}:
 *   get:
 *     summary: Get a room by ID
 *     tags: [Rooms]
 *     parameters:
 *       - $ref: '#/components/parameters/roomIdParam'
 *     responses:
 *       200:
 *         description: Room data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.get("/:id", asyncHandler(getRoomById)); // Wrapped with asyncHandler

/**
 * @swagger
 * /rooms/{id}:
 *   put:
 *     summary: Update a room by ID
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: [] # Requires JWT token (Admin role)
 *     parameters:
 *       - $ref: '#/components/parameters/roomIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoomInput' # Reusing input schema, ensure optional fields are handled
 *     responses:
 *       200:
 *         description: Room updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       400:
 *         description: Invalid input data or ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room or associated Hotel not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id",
  protect, // Added protect
  admin, // Added admin
  validateRequest(updateRoomSchema),
  asyncHandler(updateRoom) // Wrapped with asyncHandler
);

/**
 * @swagger
 * /rooms/{id}:
 *   delete:
 *     summary: Delete a room by ID
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: [] # Requires JWT token (Admin role)
 *     parameters:
 *       - $ref: '#/components/parameters/roomIdParam'
 *     responses:
 *       200:
 *         description: Room deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Room deleted successfully
 *                 roomId:
 *                    type: string
 *                    example: 60d0fe4f5311236168a109cb
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Room not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", protect, admin, asyncHandler(deleteRoom)); // Added protect & admin, wrapped with asyncHandler

export default router;

// Define Pagination schema globally if not already done in app.ts or another central place
/**
 * @swagger
 * components:
 *   schemas:
 *     Pagination:
 *       type: object
 *       properties:
 *         currentPage:
 *           type: integer
 *           example: 1
 *         totalPages:
 *           type: integer
 *           example: 5
 *         totalItems:
 *           type: integer
 *           example: 48
 *         limit:
 *           type: integer
 *           example: 10
 */
