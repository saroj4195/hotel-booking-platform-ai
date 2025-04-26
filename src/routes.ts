import express, { Request, Response } from "express";

const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome message
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Hotel Booking Platform API!");
});

/**
 * @swagger
 * /protected:
 *   get:
 *     summary: Protected route (requires authentication)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response
 *       401:
 *         description: Authentication required
 */
router.get("/protected", (req: Request, res: Response) => {
  res.send("This is a protected route.");
});

export default router;
