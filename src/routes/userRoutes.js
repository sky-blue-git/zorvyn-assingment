import express from "express";
import {
  getUsers,
  updateUserRole,
  updateUserStatus,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("Admin")); // Only admins can access User management

router.get("/", getUsers);
router.put("/:id/role", updateUserRole);
router.put("/:id/status", updateUserStatus);

export default router;
