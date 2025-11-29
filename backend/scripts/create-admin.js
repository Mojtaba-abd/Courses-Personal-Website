import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import userModel from "../models/user-model.js";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the backend root directory
dotenv.config({ path: join(__dirname, "..", ".env") });

const createAdmin = async () => {
  try {
    // Check if URL is defined
    const mongoUrl = process.env.URL || process.env.MONGODB_URI;
    
    if (!mongoUrl) {
      console.error("❌ Error: MongoDB connection string not found!");
      console.error("   Please set URL or MONGODB_URI in your .env file");
      console.error("   Example: URL=mongodb://localhost:27017/your-database");
      process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    // Connect to MongoDB with connection options
    const mongooseOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    await mongoose.connect(mongoUrl, mongooseOptions);
    console.log("✅ Connected to MongoDB");

    // Get admin credentials from command line or use defaults
    const username = process.argv[2] || "admin";
    const email = process.argv[3] || "admin@example.com";
    const password = process.argv[4] || "admin123";

    console.log(`\n📝 Creating admin user...`);
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);

    // Check if admin already exists
    const existingUser = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      console.log("\n❌ User with this username or email already exists!");
      console.log(`   Username: ${existingUser.username}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    // Create admin user
    const adminUser = await userModel.create({
      username,
      email,
      password, // Will be hashed by the pre-save hook
      role: "admin",
    });

    console.log("\n✅ Admin user created successfully!");
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   ID: ${adminUser._id}`);
    console.log("\n📝 You can now login with these credentials:");
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log("\n💡 Change the password after first login for security!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error creating admin user:", error.message);
    if (error.message.includes("connect") || error.message.includes("authentication") || error.code === 13 || error.codeName === "Unauthorized") {
      console.error("\n💡 Make sure:");
      console.error("   1. MongoDB is running");
      console.error("   2. Your .env file has the correct URL");
      if (error.message.includes("authentication") || error.code === 13 || error.codeName === "Unauthorized") {
        console.error("   3. Your connection string includes username and password:");
        console.error("      Format: mongodb://username:password@host:port/database");
        console.error("      Example: mongodb://myuser:mypassword@localhost:27017/lms-database");
      } else {
        console.error("   3. The connection string is correct");
      }
    }
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

createAdmin();
