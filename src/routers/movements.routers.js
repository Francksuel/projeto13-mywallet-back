import express from "express";
import {
	addMovement,
	userMovements,
} from "../controllers/movements.controllers.js";

const movementsRouter = express.Router();

movementsRouter.post("/movements", addMovement);
movementsRouter.get("/movements", userMovements);

export { movementsRouter };
