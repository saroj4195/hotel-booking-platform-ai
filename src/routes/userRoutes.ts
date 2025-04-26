import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import {
  updateUserProfileSchema,
  adminUpdateUserSchema,
} from "../validators/userValidator";
import { validateRequest } from "../middleware/validateRequest";
import { protect, admin } from "../middleware/authMiddleware"; // Import auth middleware

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management and admin user operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d0fe4f5311236168a109cd
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           example: john.doe@example.com
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: user
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UserProfileUpdateInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Johnny Doe
 *         email:
 *           type: string
 *           format: email
 *           example: johnny.doe@example.com
 *     AdminUserUpdateInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Johnny Doe
 *         email:
 *           type: string
 *           format: email
 *           example: johnny.doe@example.com
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: admin
 *   parameters:
 *      userIdParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: The ID of the user
 *       example: 60d0fe4f5311236168a109cd
 *      filterUserName:
 *        in: query
 *        name: name
 *        schema:
 *          type: string
 *        description: Filter users by name (case-insensitive search)
 *      filterUserEmail:
 *        in: query
 *        name: email
 *        schema:
 *          type: string
 *        description: Filter users by email (case-insensitive search)
 *      filterUserRole:
 *        in: query
 *        name: role
 *        schema:
 *          type: string
 *          enum: [user, admin]
 *        description: Filter users by role
 */

// --- User Profile Routes ---

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized (token missing or invalid)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/profile", protect, getUserProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfileUpdateInput'
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data or email already in use
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put(
  "/profile",
  protect,
  validateRequest(updateUserProfileSchema),
  updateUserProfile
);

// --- Admin User Management Routes ---

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/paginationPage'
 *       - $ref: '#/components/parameters/paginationLimit'
 *       - $ref: '#/components/parameters/filterUserName'
 *       - $ref: '#/components/parameters/filterUserEmail'
 *       - $ref: '#/components/parameters/filterUserRole'
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User is not an admin)
 *       500:
 *         description: Server error
 */
router.get("/", protect, admin, getUsers); // Query validation in controller

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: User data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User is not an admin)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get("/:id", protect, admin, getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user by ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUserUpdateInput'
 *     responses:
 *       200:
 *         description: User updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data, ID format, or email already in use
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User is not an admin)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id",
  protect,
  admin,
  validateRequest(adminUpdateUserSchema),
  updateUser
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user by ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userIdParam'
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User removed successfully
 *                 userId:
 *                    type: string
 *                    example: 60d0fe4f5311236168a109cd
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User is not an admin)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", protect, admin, deleteUser);

export default router;
