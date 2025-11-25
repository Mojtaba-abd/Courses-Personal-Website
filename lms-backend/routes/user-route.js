import Express from "express";
import {
  getAllUsers,
  searchUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user-controller.js";
import { authenticate, requireAdmin } from "../middleware/auth-middleware.js";

const userRouter = Express.Router();

// All user routes require admin authentication
userRouter.get("/", authenticate, requireAdmin, getAllUsers);
userRouter.get("/search", authenticate, requireAdmin, searchUsers);
userRouter.get("/:id", authenticate, requireAdmin, getUserById);
userRouter.patch("/:id", authenticate, requireAdmin, updateUser);
userRouter.delete("/:id", authenticate, requireAdmin, deleteUser);

export default userRouter;

