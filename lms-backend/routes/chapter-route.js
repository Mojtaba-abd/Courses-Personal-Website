import Express from "express";
import {
  addChapter,
  deleteChapter,
  getAllChapters,
  getOneChapter,
  publishChapter,
  reorderChapter,
  updateChapterInfo,
  getPurchasedChapters,
  getPublishedChapterOfOneCourse,
  updateChapetrProgress,
} from "../controllers/chapter-controller.js";
import { authenticate, requireTeacherOrAdmin, optionalAuth } from "../middleware/auth-middleware.js";

const chapterRouter = Express.Router();

// Public routes
chapterRouter.get("/:courseId", getAllChapters);
chapterRouter.get("/:courseId/published", getPublishedChapterOfOneCourse);
chapterRouter.get("/:chapterId/course/:courseId", optionalAuth, getOneChapter);
chapterRouter.get("/:chapterId/user/:userId", getPurchasedChapters);

// Authenticated routes (teachers and admins)
chapterRouter.post("/", authenticate, requireTeacherOrAdmin, addChapter);
chapterRouter.patch("/:chapterId/reorder", authenticate, requireTeacherOrAdmin, reorderChapter);
chapterRouter.patch("/:chapterId/course/:courseId", authenticate, requireTeacherOrAdmin, updateChapterInfo);
chapterRouter.patch("/:chapterId/course/:courseId/publish", authenticate, requireTeacherOrAdmin, publishChapter);
chapterRouter.delete("/:chapterId/course/:courseId", authenticate, requireTeacherOrAdmin, deleteChapter);

// Student progress route (authenticated but not teacher/admin required)
chapterRouter.post(
  "/:chapterId/course/:courseId/progress",
  authenticate,
  updateChapetrProgress
);

export default chapterRouter;
