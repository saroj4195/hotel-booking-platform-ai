"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome message
 *     responses:
 *       200:
 *         description: Successful response
 */
router.get("/", (req, res) => {
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
router.get("/protected", (req, res) => {
    res.send("This is a protected route.");
});
exports.default = router;
