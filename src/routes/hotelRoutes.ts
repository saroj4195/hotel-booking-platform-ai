import express from "express";
import {
  createHotel,
  getHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
} from "../controllers/hotelController";
import {
  createHotelSchema,
  updateHotelSchema,
} from "../validators/hotelValidator";
import { validateRequest } from "../middleware/validateRequest"; // Middleware to handle Joi validation
// import { protect, admin } from '../middleware/authMiddleware'; // Import auth middleware later

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Hotels
 *   description: Hotel management and retrieval
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Hotel:
 *       type: object
 *       required:
 *         - name
 *         - location
 *         - description
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the hotel
 *           example: 60d0fe4f5311236168a109ca
 *         name:
 *           type: string
 *           description: Name of the hotel
 *           example: Grand Hyatt
 *         location:
 *           type: string
 *           description: Location of the hotel
 *           example: New York, USA
 *         description:
 *           type: string
 *           description: Description of the hotel
 *           example: A luxurious hotel in the heart of the city.
 *         photos:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: URLs of hotel photos
 *           example: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
 *         rating:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 5
 *           description: Average rating of the hotel
 *           example: 4.5
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of creation
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *     HotelInput:
 *       type: object
 *       required:
 *         - name
 *         - location
 *         - description
 *       properties:
 *         name:
 *           type: string
 *           example: Grand Hyatt
 *         location:
 *           type: string
 *           example: New York, USA
 *         description:
 *           type: string
 *           example: A luxurious hotel in the heart of the city.
 *         photos:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           example: ["https://example.com/photo1.jpg"]
 *         rating:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 5
 *           example: 4.5
 *   parameters:
 *     hotelIdParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: The ID of the hotel
 *       example: 60d0fe4f5311236168a109ca
 *     paginationPage:
 *       in: query
 *       name: page
 *       schema:
 *         type: integer
 *         default: 1
 *       description: Page number for pagination
 *     paginationLimit:
 *       in: query
 *       name: limit
 *       schema:
 *         type: integer
 *         default: 10
 *       description: Number of items per page
 *     filterLocation:
 *       in: query
 *       name: location
 *       schema:
 *         type: string
 *       description: Filter hotels by location (case-insensitive search)
 *     filterMinRating:
 *       in: query
 *       name: minRating
 *       schema:
 *         type: number
 *         format: float
 *         minimum: 0
 *         maximum: 5
 *       description: Filter hotels by minimum rating
 *   securitySchemes:
 *     bearerAuth: # Defined in app.ts, referenced here
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /hotels:
 *   get:
 *     summary: Retrieve a list of hotels
 *     tags: [Hotels]
 *     parameters:
 *       - $ref: '#/components/parameters/paginationPage'
 *       - $ref: '#/components/parameters/paginationLimit'
 *       - $ref: '#/components/parameters/filterLocation'
 *       - $ref: '#/components/parameters/filterMinRating'
 *     responses:
 *       200:
 *         description: A list of hotels with pagination info.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hotel'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get("/", getHotels);

/**
 * @swagger
 * /hotels:
 *   post:
 *     summary: Create a new hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: [] # Requires JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HotelInput'
 *     responses:
 *       201:
 *         description: Hotel created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized (JWT token missing or invalid, or user not admin)
 *       500:
 *         description: Server error
 */
// Add protect and admin middleware later: router.post('/', protect, admin, validateRequest(createHotelSchema), createHotel);
router.post("/", validateRequest(createHotelSchema), createHotel); // Validation added

/**
 * @swagger
 * /hotels/{id}:
 *   get:
 *     summary: Get a hotel by ID
 *     tags: [Hotels]
 *     parameters:
 *       - $ref: '#/components/parameters/hotelIdParam'
 *     responses:
 *       200:
 *         description: Hotel data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.get("/:id", getHotelById);

/**
 * @swagger
 * /hotels/{id}:
 *   put:
 *     summary: Update a hotel by ID
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/hotelIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HotelInput' # Can reuse or create a specific update schema
 *     responses:
 *       200:
 *         description: Hotel updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       400:
 *         description: Invalid input data or ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
// Add protect and admin middleware later: router.put('/:id', protect, admin, validateRequest(updateHotelSchema), updateHotel);
router.put("/:id", validateRequest(updateHotelSchema), updateHotel); // Validation added

/**
 * @swagger
 * /hotels/{id}:
 *   delete:
 *     summary: Delete a hotel by ID
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/hotelIdParam'
 *     responses:
 *       200:
 *         description: Hotel deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Hotel deleted successfully
 *                 hotelId:
 *                    type: string
 *                    example: 60d0fe4f5311236168a109ca
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
// Add protect and admin middleware later: router.delete('/:id', protect, admin, deleteHotel);
router.delete("/:id", deleteHotel);

export default router;
