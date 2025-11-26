import Express from "express";
import {
  getAllLessons,
  getOneLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} from "../controllers/lesson-controller.js";
import { authenticate, requireAdmin, requireTeacherOrAdmin } from "../middleware/auth-middleware.js";

const lessonRouter = Express.Router();

// Public routes (for viewing published lessons)
lessonRouter.get("/chapter/:chapterId", getAllLessons);
lessonRouter.get("/:lessonId/chapter/:chapterId", getOneLesson);

// Teacher and Admin routes
lessonRouter.post("/", authenticate, requireTeacherOrAdmin, createLesson);
lessonRouter.put("/:lessonId/chapter/:chapterId", authenticate, requireTeacherOrAdmin, updateLesson);
lessonRouter.delete("/:lessonId/chapter/:chapterId", authenticate, requireTeacherOrAdmin, deleteLesson);
lessonRouter.patch("/:lessonId/reorder", authenticate, requireTeacherOrAdmin, reorderLessons);

export default lessonRouter;

