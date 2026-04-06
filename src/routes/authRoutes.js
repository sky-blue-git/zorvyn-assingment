import express from "express";
import rateLimit from "express-rate-limit";
import { registerUser, loginUser } from "../controllers/authController.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts, please try again later" },
});

router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);

export default router;
