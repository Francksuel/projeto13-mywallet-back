import express from "express";
import { signIn, signUp } from "../controllers/auth.controllers.js";

const authRouter = express.Router();

authRouter.post("/sign-up", signUp);
authRouter.post("/sign-in", signIn);

export { authRouter };
