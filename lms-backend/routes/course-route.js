import Express from "express";
import {
  createCourse,
  getAllCourses,
  getPublishedCourses,
  getOneCourse,
  updateCourse,
  deleteCourse,
  updataTitle,
  addAttachments,
  deleteAttachments,
  purchaseCourse,
  getPurchasedCourses,
} from "../controllers/course-controller.js";
import { authenticate, requireAdmin, optionalAuth } from "../middleware/auth-middleware.js";

const courseRouter = Express.Router();

// Public route - no auth required (for home page)
courseRouter.get("/public", getPublishedCourses);

// Public routes with optional auth (to check if user is admin)
courseRouter.get("/", optionalAuth, getAllCourses);
courseRouter.get("/:courseId", optionalAuth, getOneCourse);
courseRouter.get("/user/:userId/purchased", getPurchasedCourses);

// Authenticated routes (teachers and admins can create courses)
courseRouter.post("/", authenticate, createCourse);
courseRouter.put("/:courseId", authenticate, requireAdmin, updateCourse);
courseRouter.delete("/:courseId", authenticate, requireAdmin, deleteCourse);

// Existing routes (for backward compatibility)
courseRouter.post("/:courseId/attachments", authenticate, addAttachments);
courseRouter.post("/:courseId/user/:userId/purchased", purchaseCourse);
courseRouter.patch("/:courseId", authenticate, updataTitle);
courseRouter.delete("/:courseId/attachments/:attachmentIdx", authenticate, deleteAttachments);

export default courseRouter;
