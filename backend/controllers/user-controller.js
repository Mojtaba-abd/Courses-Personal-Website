import userModel from "../models/user-model.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ error: error.message || "Failed to get users" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};

    if (q && q.trim()) {
      query.$or = [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const users = await userModel
      .find(query)
      .select("-password")
      .limit(50)
      .sort({ createdAt: -1 });

    res.status(200).json({ users });
  } catch (error) {
    console.error("Search users error:", error);
    return res.status(500).json({ error: error.message || "Failed to search users" });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ error: error.message || "Failed to get user" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, password } = req.body;

    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update fields
    if (username !== undefined) user.username = username;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (password !== undefined && password.trim()) {
      user.password = password; // Will be hashed by pre-save hook
    }

    await user.save();

    const userResponse = await userModel.findById(id).select("-password");
    res.status(200).json({ user: userResponse });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ error: error.message || "Failed to update user" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (req.user.userId === id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const user = await userModel.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ error: error.message || "Failed to delete user" });
  }
};
