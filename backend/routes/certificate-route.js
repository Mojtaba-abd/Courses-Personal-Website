import Express from "express";
import {
  getAllCertificates,
  getPublicCertificates,
  getOneCertificate,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from "../controllers/certificate-controller.js";
import { authenticate, requireAdmin, optionalAuth } from "../middleware/auth-middleware.js";

const certificateRouter = Express.Router();

// Public route - no auth required (for home page)
certificateRouter.get("/public", getPublicCertificates);

// Public routes with optional auth (for admin dashboard)
certificateRouter.get("/", optionalAuth, getAllCertificates);
certificateRouter.get("/:certificateId", optionalAuth, getOneCertificate);

// Admin-only routes
certificateRouter.post("/", authenticate, requireAdmin, createCertificate);
certificateRouter.put("/:certificateId", authenticate, requireAdmin, updateCertificate);
certificateRouter.delete("/:certificateId", authenticate, requireAdmin, deleteCertificate);

export default certificateRouter;

