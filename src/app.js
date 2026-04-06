import express from "express";
import "dotenv/config";
import connectDB from "./config/db.js";

const app = express();
app.use(express.json());

connectDB();

app.get("/", (req, res) => res.send("Server is Running"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Server running at port http://localhost:${PORT}`),
);
