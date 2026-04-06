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
    const [totals, categoryTotals, recentActivity, monthlyTrends] = await Promise.all([
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

      // 4. Monthly Trends
      Record.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              year: { $year: "$date" },
              month: { $month: "$date" },
              type: "$type",
            },
            totalAmount: { $sum: "$amount" },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
      ]),
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

    // Format Monthly Trends
    const trends = {};
    monthlyTrends.forEach((t) => {
      const label = `${t._id.year}-${String(t._id.month).padStart(2, "0")}`;
      if (!trends[label]) trends[label] = { income: 0, expense: 0 };
      trends[label][t._id.type] = t.totalAmount;
    });

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
      trends,
    });
  } catch (error) {
    next(error);
  }
};
