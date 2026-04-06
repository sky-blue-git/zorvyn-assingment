import express from "express";
import {
  createRecord,
  getRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} from "../controllers/recordController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Apply protect middleware to all record routes
router.use(protect);

// Analysts & Admins can view records
router.get("/", authorizeRoles("Analyst", "Admin"), getRecords);
router.get("/:id", authorizeRoles("Analyst", "Admin"), getRecordById);

// Only Admins can modify records
router.post("/", authorizeRoles("Admin"), createRecord);
router.put("/:id", authorizeRoles("Admin"), updateRecord);
router.delete("/:id", authorizeRoles("Admin"), deleteRecord);

export default router;
