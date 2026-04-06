import express from "express";
import "dotenv/config";
import connectDB from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use(express.json());

connectDB();

app.get("/", (req, res) => res.send("Server is Running"));

app.use("/api/auth", authRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`),
);
