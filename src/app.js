import express from "express";
import cors from "cors";
import { authRouter } from "./routers/auth.routers.js";
import { movementsRouter } from "./routers/movements.routers.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use(authRouter);

app.use(movementsRouter)

export default app;