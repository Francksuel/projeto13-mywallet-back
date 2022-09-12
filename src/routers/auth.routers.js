import express from "express";
import { signIn, signUp } from "../controllers/auth.controllers.js";
import { userValidationSchema } from "../middlewares/userSchema.middleware.js";

const authRouter = express.Router();

authRouter.post("/sign-up",userValidationSchema, signUp);
authRouter.post("/sign-in", signIn);

export { authRouter };
