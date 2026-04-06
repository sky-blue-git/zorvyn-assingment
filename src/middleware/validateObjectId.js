import mongoose from "mongoose";

export const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    return next(new Error("Invalid ID format"));
  }
  next();
};
