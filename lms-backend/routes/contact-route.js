import Express from "express";
import { sendContactEmail } from "../controllers/contact-controller.js";

const contactRouter = Express.Router();

contactRouter.post("/", sendContactEmail);

export default contactRouter;

