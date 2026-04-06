import Record from "../models/Record.js";
import { z } from "zod";

const recordSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1),
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid startDate format").optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid endDate format").optional(),
});

export const createRecord = async (req, res, next) => {
  try {
    const validatedData = recordSchema.parse(req.body);

    const record = await Record.create({
      ...validatedData,
      createdBy: req.user._id,
    });

    res.status(201).json(record);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors.map((e) => e.message).join(", ")));
    }
    next(error);
  }
};

export const getRecords = async (req, res, next) => {
  try {
    const validatedQuery = querySchema.parse(req.query);
    const { type, category, startDate, endDate, page, limit } = validatedQuery;

    const query = { isDeleted: false };
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const records = await Record.find(query)
      .populate("createdBy", "name email")
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Record.countDocuments(query);

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      data: records,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors.map((e) => e.message).join(", ")));
    }
    next(error);
  }
};

export const getRecordById = async (req, res, next) => {
  try {
    const record = await Record.findOne({ _id: req.params.id, isDeleted: false })
      .populate("createdBy", "name email");

    if (!record) {
      res.status(404);
      throw new Error("Record not found");
    }

    res.json(record);
  } catch (error) {
    next(error);
  }
};

export const updateRecord = async (req, res, next) => {
  try {
    const validatedData = recordSchema.partial().parse(req.body);

    const record = await Record.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      validatedData,
      { new: true, runValidators: true }
    );

    if (!record) {
      res.status(404);
      throw new Error("Record not found");
    }

    res.json(record);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors.map((e) => e.message).join(", ")));
    }
    next(error);
  }
};

export const deleteRecord = async (req, res, next) => {
  try {
    const record = await Record.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!record) {
      res.status(404);
      throw new Error("Record not found");
    }

    res.json({ message: "Record soft deleted successfully" });
  } catch (error) {
    next(error);
  }
};
