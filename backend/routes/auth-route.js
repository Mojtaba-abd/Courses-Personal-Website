import Express from "express";
import { login, register, getMe, logout, testAuth } from "../controllers/auth-controller.js";
import { authenticate, requireAdmin } from "../middleware/auth-middleware.js";

const authRouter = Express.Router();

authRouter.post("/login", login);
authRouter.post("/register", authenticate, requireAdmin, register);
authRouter.get("/me", authenticate, getMe);
authRouter.get("/test-auth", authenticate, testAuth);
authRouter.post("/logout", logout);

export default authRouter;

