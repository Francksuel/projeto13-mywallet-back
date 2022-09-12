import express from "express";
import cors from "cors";
import { signIn, signUp } from "./controllers/auth.controllers.js";
import {
	addMovement,
	userMovements,
} from "./controllers/movements.controllers.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/sign-up", signUp);

app.post("/sign-in", signIn);

app.post("/movements", addMovement);

app.get("/movements", userMovements);

export default app;