import Express from "express";
import {
  getAllPosts,
  getOnePost,
  createPost,
  updatePost,
  deletePost,
} from "../controllers/post-controller.js";
import { authenticate, requireAdmin, optionalAuth } from "../middleware/auth-middleware.js";

const postRouter = Express.Router();

// Public routes
postRouter.get("/", optionalAuth, getAllPosts);
postRouter.get("/slug/:slug", optionalAuth, getOnePost);

// Admin-only routes
postRouter.post("/", authenticate, requireAdmin, createPost);
postRouter.put("/:postId", authenticate, requireAdmin, updatePost);
postRouter.delete("/:postId", authenticate, requireAdmin, deletePost);

export default postRouter;

