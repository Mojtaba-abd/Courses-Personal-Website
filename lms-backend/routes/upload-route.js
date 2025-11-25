import Express from "express";
import { upload, uploadFile, uploadImage } from "../controllers/upload-controller.js";
import { authenticate, requireAdmin } from "../middleware/auth-middleware.js";

const uploadRouter = Express.Router();

// File upload (for lesson attachments)
uploadRouter.post(
  "/file",
  authenticate,
  requireAdmin,
  upload.single("file"),
  uploadFile
);

// Image upload (for rich text editor)
uploadRouter.post(
  "/image",
  authenticate,
  requireAdmin,
  upload.single("image"),
  uploadImage
);

export default uploadRouter;

