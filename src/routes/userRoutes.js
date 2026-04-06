import express from "express";
import {
  getUsers,
  updateUserRole,
  updateUserStatus,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("Admin")); // Only admins can access user management

router.get("/", getUsers);
router.put("/:id/role", validateObjectId, updateUserRole);
router.put("/:id/status", validateObjectId, updateUserStatus);

export default router;
