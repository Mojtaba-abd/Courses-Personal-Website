import Express from "express";
import {
  getAllLessons,
  getOneLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from "../controllers/lesson-controller.js";
import { authenticate, requireAdmin } from "../middleware/auth-middleware.js";

const lessonRouter = Express.Router();

// Public routes (for viewing published lessons)
lessonRouter.get("/chapter/:chapterId", getAllLessons);
lessonRouter.get("/:lessonId/chapter/:chapterId", getOneLesson);

// Admin-only routes
lessonRouter.post("/", authenticate, requireAdmin, createLesson);
lessonRouter.put("/:lessonId/chapter/:chapterId", authenticate, requireAdmin, updateLesson);
lessonRouter.delete("/:lessonId/chapter/:chapterId", authenticate, requireAdmin, deleteLesson);
lessonRouter.patch("/:lessonId/reorder", authenticate, requireAdmin, reorderLessons);

export default lessonRouter;

