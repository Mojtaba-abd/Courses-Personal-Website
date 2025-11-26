import Express from "express";
import {
  getAllPosts,
  getOnePost,
  getOnePostById,
  createPost,
  updatePost,
  deletePost,
} from "../controllers/post-controller.js";
import { authenticate, requireAdmin, optionalAuth } from "../middleware/auth-middleware.js";

const postRouter = Express.Router();

// Public routes - order matters: specific routes before dynamic ones
postRouter.get("/", optionalAuth, getAllPosts);
postRouter.get("/slug/:slug", optionalAuth, getOnePost);

// Admin-only routes
postRouter.post("/", authenticate, requireAdmin, createPost);
postRouter.get("/:postId", authenticate, requireAdmin, getOnePostById);
postRouter.put("/:postId", authenticate, requireAdmin, updatePost);
postRouter.delete("/:postId", authenticate, requireAdmin, deletePost);

export default postRouter;

