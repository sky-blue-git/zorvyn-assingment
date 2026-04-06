import Record from "../models/Record.js";
import { z } from "zod";

const recordSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1),
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
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
    const { type, category, startDate, endDate, page = 1, limit = 10 } = req.query;

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
