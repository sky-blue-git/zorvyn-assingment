import Record from "../models/Record.js";
import { z } from "zod";

const dashboardQuerySchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid startDate format").optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid endDate format").optional(),
});

export const getDashboardSummary = async (req, res, next) => {
  try {
    const validatedQuery = dashboardQuerySchema.parse(req.query);
    const { startDate, endDate } = validatedQuery;

    const matchStage = { isDeleted: false };

    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    // Parallel aggregation queries for performance
    const [totals, categoryTotals, recentActivity] = await Promise.all([
      // 1. Total Income & Expenses
      Record.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),

      // 2. Category-wise Totals
      Record.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { type: "$type", category: "$category" },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),

      // 3. Recent Activity (Latest 5 records)
      Record.find(matchStage)
        .sort({ date: -1 })
        .limit(5)
        .populate("createdBy", "name email"),
    ]);

    // Format Totals
    let totalIncome = 0;
    let totalExpenses = 0;

    totals.forEach((t) => {
      if (t._id === "income") totalIncome = t.totalAmount;
      if (t._id === "expense") totalExpenses = t.totalAmount;
    });

    const netBalance = totalIncome - totalExpenses;

    // Format Category Totals
    const expensesByCategory = categoryTotals
      .filter((c) => c._id.type === "expense")
      .map((c) => ({ category: c._id.category, amount: c.totalAmount }));

    const incomeByCategory = categoryTotals
      .filter((c) => c._id.type === "income")
      .map((c) => ({ category: c._id.category, amount: c.totalAmount }));

    res.json({
      summary: {
        totalIncome,
        totalExpenses,
        netBalance,
      },
      categoryWise: {
        income: incomeByCategory,
        expenses: expensesByCategory,
      },
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};
