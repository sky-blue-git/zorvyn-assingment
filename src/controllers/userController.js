import User from "../models/User.js";
import { z } from "zod";

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const updateRoleSchema = z.object({
  role: z.enum(["Viewer", "Analyst", "Admin"]),
});

export const updateUserRole = async (req, res, next) => {
  try {
    const validatedData = updateRoleSchema.parse(req.body);

    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    user.role = validatedData.role;
    await user.save();

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors.map((e) => e.message).join(", ")));
    }
    next(error);
  }
};

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

export const updateUserStatus = async (req, res, next) => {
  try {
    const validatedData = updateStatusSchema.parse(req.body);

    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    user.isActive = validatedData.isActive;
    await user.save();

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400);
      return next(new Error(error.errors.map((e) => e.message).join(", ")));
    }
    next(error);
  }
};
