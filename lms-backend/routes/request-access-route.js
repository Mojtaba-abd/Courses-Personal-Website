import Express from "express";
import { createRequestAccess } from "../controllers/request-access-controller.js";

const requestAccessRouter = Express.Router();

// Public route - no authentication required
requestAccessRouter.post("/", createRequestAccess);

export default requestAccessRouter;

