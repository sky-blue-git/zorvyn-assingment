import express from "express";
import { getDashboardSummary } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);

// All roles (Viewer, Analyst, Admin) can view dashboard summary
router.get("/summary", authorizeRoles("Viewer", "Analyst", "Admin"), getDashboardSummary);

export default router;
