import express from "express";
import {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
} from "../controllers/reviewController";
import { reviewSchema } from "../validators/reviewValidator";
import { validateRequest } from "../middleware/validateRequest";
import { protect, admin } from "../middleware/authMiddleware"; // Import auth middleware

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Hotel review management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d0fe4f5311236168a109ce
 *         user_id:
 *           type: string # Or $ref: '#/components/schemas/User' (populated)
 *           description: ID of the user who wrote the review
 *           example: 60d0fe4f5311236168a109cd
 *         hotel_id:
 *           type: string # Or $ref: '#/components/schemas/Hotel' (populated)
 *           description: ID of the reviewed hotel
 *           example: 60d0fe4f5311236168a109ca
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating given (1-5)
 *           example: 4
 *         comment:
 *           type: string
 *           description: Optional comment
 *           example: "Great location, friendly staff!"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ReviewInput:
 *       type: object
 *       required:
 *         - hotel_id
 *         - rating
 *       properties:
 *         hotel_id:
 *           type: string
 *           description: ID of the hotel being reviewed
 *           example: 60d0fe4f5311236168a109ca
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Rating (1-5)
 *           example: 5
 *         comment:
 *           type: string
 *           description: Optional comment
 *           example: "Absolutely fantastic stay!"
 *   parameters:
 *     reviewIdParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: The ID of the review
 *       example: 60d0fe4f5311236168a109ce
 *     filterReviewHotelId:
 *       in: query
 *       name: hotel_id
 *       schema:
 *         type: string
 *       description: Filter reviews by Hotel ID
 *       example: 60d0fe4f5311236168a109ca
 *     filterReviewUserId:
 *       in: query
 *       name: user_id
 *       schema:
 *         type: string
 *       description: Filter reviews by User ID
 *       example: 60d0fe4f5311236168a109cd
 *     filterReviewMinRating:
 *       in: query
 *       name: min_rating
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 5
 *       description: Filter reviews with rating >= this value
 *     filterReviewMaxRating:
 *       in: query
 *       name: max_rating
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 5
 *       description: Filter reviews with rating <= this value
 */

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Retrieve a list of reviews with filtering and pagination
 *     tags: [Reviews]
 *     parameters:
 *       - $ref: '#/components/parameters/paginationPage'
 *       - $ref: '#/components/parameters/paginationLimit'
 *       - $ref: '#/components/parameters/filterReviewHotelId'
 *       - $ref: '#/components/parameters/filterReviewUserId'
 *       - $ref: '#/components/parameters/filterReviewMinRating'
 *       - $ref: '#/components/parameters/filterReviewMaxRating'
 *     responses:
 *       200:
 *         description: A list of reviews.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review' # Note: User/Hotel might be populated
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */
router.get("/", getReviews); // Query validation in controller

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: [] # Requires JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewInput'
 *     responses:
 *       201:
 *         description: Review created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Invalid input data, Hotel ID format, or user already reviewed this hotel
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Hotel not found
 *       500:
 *         description: Server error
 */
router.post("/", protect, validateRequest(reviewSchema), createReview);

/**
 * @swagger
 * /reviews/{id}:
 *   get:
 *     summary: Get a review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - $ref: '#/components/parameters/reviewIdParam'
 *     responses:
 *       200:
 *         description: Review data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Review not found
 *       500:
 *         description: Server error
 */
router.get("/:id", getReviewById);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Update a review by ID
 *     description: Allows the owner of a review to update their rating or comment.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: [] # Requires JWT token
 *     parameters:
 *       - $ref: '#/components/parameters/reviewIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewInput' # Reusing input schema, but only rating/comment are updatable
 *     responses:
 *       200:
 *         description: Review updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Invalid input data or ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User is not the owner of the review)
 *       404:
 *         description: Review not found
 *       500:
 *         description: Server error
 */
router.put("/:id", protect, validateRequest(reviewSchema), updateReview);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review by ID
 *     description: Allows the owner or an admin to delete a review.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: [] # Requires JWT token
 *     parameters:
 *       - $ref: '#/components/parameters/reviewIdParam'
 *     responses:
 *       200:
 *         description: Review deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Review deleted successfully
 *                 reviewId:
 *                    type: string
 *                    example: 60d0fe4f5311236168a109ce
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User not authorized to delete this review)
 *       404:
 *         description: Review not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", protect, deleteReview); // Admin check happens in controller

export default router;
