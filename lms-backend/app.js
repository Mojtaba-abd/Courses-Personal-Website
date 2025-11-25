import Express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import courseRouter from "./routes/course-route.js";
import categoryRouter from "./routes/category-route.js";
import chapterRouter from "./routes/chapter-route.js";
import lessonRouter from "./routes/lesson-route.js";
import StripeCustomerRouter from "./routes/stripeCustomer-route.js";
import authRouter from "./routes/auth-route.js";
import contactRouter from "./routes/contact-route.js";
import userRouter from "./routes/user-route.js";
import uploadRouter from "./routes/upload-route.js";
import certificateRouter from "./routes/certificate-route.js";
import postRouter from "./routes/post-route.js";
import requestAccessRouter from "./routes/request-access-route.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();

const app = Express();

// Increase body size limits for JSON and URL-encoded data (50MB)
// This is needed for rich text content and lesson data with attachments
app.use(Express.json({ limit: "50mb" }));
app.use(Express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Enable CORS for all routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow requests from frontend (support multiple origins)
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_BACK_END_URL?.replace(":8000", ":3000"),
  ].filter(Boolean);
  
  // If origin matches allowed origins or contains localhost, allow it
  if (origin) {
    if (allowedOrigins.includes(origin) || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
  } else {
    // For same-origin requests (no origin header), allow it
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Cookie");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
  
  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
});

app.use("/api/courses", courseRouter);
app.use("/api/category", categoryRouter);
app.use("/api/chapters", chapterRouter);
app.use("/api/lessons", lessonRouter);
app.use("/api/stripeCustomers", StripeCustomerRouter);
app.use("/api/auth", authRouter);
app.use("/api/contact", contactRouter);
app.use("/api/users", userRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/certificates", certificateRouter);
app.use("/api/posts", postRouter);
app.use("/api/request-access", requestAccessRouter);

// Serve uploaded files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", Express.static(path.join(__dirname, "public", "uploads")));

// Use URL or MONGODB_URI from environment
const mongoUrl = process.env.URL || process.env.MONGODB_URI;
const port = process.env.PORT || 8000;

if (!mongoUrl) {
  console.error("❌ Error: MongoDB connection string not found!");
  console.error("   Please set URL or MONGODB_URI in your .env file");
  process.exit(1);
}

mongoose
  .connect(mongoUrl)
  .then(() => {
    app.listen(port, () => console.log(`✅ Server connected on port ${port}`));
  })
  .catch((err) => {
    console.log("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
