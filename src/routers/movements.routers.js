import express from "express";
import {
	addMovement,
	userMovements,
} from "../controllers/movements.controllers.js";
import { checkUser } from "../middlewares/authorization.middleware.js";
import { movementValidationSchema } from "../middlewares/movementSchema.middleware.js";

const movementsRouter = express.Router();

movementsRouter.use(checkUser);

movementsRouter.post("/movements", movementValidationSchema, addMovement);
movementsRouter.get("/movements", userMovements);

export { movementsRouter };
