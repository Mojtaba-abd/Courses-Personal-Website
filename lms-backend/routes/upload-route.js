import Express from "express";
import { upload, uploadFile, uploadImage } from "../controllers/upload-controller.js";
import { authenticate, requireAdmin, requireTeacherOrAdmin } from "../middleware/auth-middleware.js";

const uploadRouter = Express.Router();

// File upload (for lesson attachments)
uploadRouter.post(
  "/file",
  authenticate,
  requireTeacherOrAdmin,
  upload.single("file"),
  uploadFile
);

// Image upload (for rich text editor, course images, featured images)
uploadRouter.post(
  "/image",
  authenticate,
  requireTeacherOrAdmin,
  upload.single("image"),
  uploadImage
);

export default uploadRouter;

