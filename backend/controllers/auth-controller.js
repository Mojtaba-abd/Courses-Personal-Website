import userModel from "../models/user-model.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("Login attempt for username:", username);

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Find user with case-insensitive username lookup and explicitly select password field
    const user = await userModel.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, "i") } 
    }).select("+password");

    if (!user) {
      console.log("User not found:", username);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("User found:", user.username, "Comparing password...");
    
    // Check if password exists and is not null
    if (!user.password) {
      console.log("User password is missing!");
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.log("Password mismatch for user:", user.username);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("Password valid, generating token...");

    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Set to false for localhost, true in production with HTTPS
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
      domain: undefined, // Don't set domain for localhost
    });

    console.log("Login successful for user:", user.username);

    res.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!["admin", "student", "teacher"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this username or email already exists",
      });
    }

    const user = await userModel.create({
      username,
      email,
      password,
      role,
    });

    res.status(201).json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ message: "Logged out successfully" });
};

export const testAuth = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Test auth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

