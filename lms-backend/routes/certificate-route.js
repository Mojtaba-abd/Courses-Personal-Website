import Express from "express";
import {
  getAllCertificates,
  getOneCertificate,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from "../controllers/certificate-controller.js";
import { authenticate, requireAdmin, optionalAuth } from "../middleware/auth-middleware.js";

const certificateRouter = Express.Router();

// Public routes
certificateRouter.get("/", optionalAuth, getAllCertificates);
certificateRouter.get("/:certificateId", optionalAuth, getOneCertificate);

// Admin-only routes
certificateRouter.post("/", authenticate, requireAdmin, createCertificate);
certificateRouter.put("/:certificateId", authenticate, requireAdmin, updateCertificate);
certificateRouter.delete("/:certificateId", authenticate, requireAdmin, deleteCertificate);

export default certificateRouter;

