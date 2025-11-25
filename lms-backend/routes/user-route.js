import Express from "express";
import {
  getAllUsers,
  searchUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user-controller.js";
import { authenticate, requireAdmin, requireTeacherOrAdmin } from "../middleware/auth-middleware.js";

const userRouter = Express.Router();

// User search and list - teachers and admins can search for enrollment purposes
userRouter.get("/", authenticate, requireTeacherOrAdmin, getAllUsers);
userRouter.get("/search", authenticate, requireTeacherOrAdmin, searchUsers);

// Individual user routes - admin only
userRouter.get("/:id", authenticate, requireAdmin, getUserById);
userRouter.patch("/:id", authenticate, requireAdmin, updateUser);
userRouter.delete("/:id", authenticate, requireAdmin, deleteUser);

export default userRouter;

