import mongoose from "mongoose";
import bcrypt from "bcrypt";
import "dotenv/config";
import User from "./models/User.js";
import Record from "./models/Record.js";
import connectDB from "./config/db.js";

const seedData = async () => {
  try {
    await connectDB();

    await User.deleteMany();
    await Record.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash("password123", salt);

    const users = await User.insertMany([
      { name: "Admin User", email: "admin@test.com", password, role: "Admin" },
      { name: "Analyst User", email: "analyst@test.com", password, role: "Analyst" },
      { name: "Viewer User", email: "viewer@test.com", password, role: "Viewer" },
    ]);

    const adminId = users[0]._id;
    const analystId = users[1]._id;

    await Record.insertMany([
      { amount: 5000, type: "income", category: "Salary", date: new Date("2024-01-01"), createdBy: adminId },
      { amount: 200, type: "income", category: "Freelance", date: new Date("2024-01-10"), createdBy: adminId },
      { amount: 1500, type: "expense", category: "Rent", date: new Date("2024-01-05"), createdBy: adminId },
      { amount: 300, type: "expense", category: "Groceries", date: new Date("2024-01-08"), createdBy: analystId },
      { amount: 100, type: "expense", category: "Utilities", date: new Date("2024-01-15"), createdBy: adminId },
    ]);

    console.log("Database Seeded Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error Seeding Database:", error);
    process.exit(1);
  }
};

seedData();
