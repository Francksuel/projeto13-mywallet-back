import mongo from "../database/db.js";
import joi from "joi";
import { stripHtml } from "string-strip-html";

let db = await mongo();

const movementSchema = joi.object({
	valor: joi.number().positive().required(),
	description: joi.string().min(1).required(),
	type: joi.string().valid("entrada", "saída").required(),
});

const addMovement = async (req, res) => {
	const { authorization } = req.headers;
	const token = authorization?.replace("Bearer ", "");
	if (!token) return res.sendStatus(401);
	try {
		const session = await db.collection("sessions").findOne({ token });
		if (!session) return res.sendStatus(401);

		const movement = req.body;
		if (movement.valor && movement.description) {
			movement.valor = stripHtml(movement.valor).result.trim();
			movement.description = stripHtml(movement.description).result.trim();
		}
		const moveValidation = movementSchema.validate(movement, {
			abortEarly: false,
		});

		if (moveValidation.error) {
			const errors = moveValidation.error.details.map((error) => error.message);
			return res.status(422).send(errors);
		}
		await db.collection("movements").insertOne({
			userId: session.userId,
			valor: movement.valor,
			description: movement.description,
			type: movement.type,
			day: Date.now(),
		});
		res.sendStatus(201);
	} catch {
		res.sendStatus(500);
	}
};
const userMovements = async (req, res) => {
	const { authorization } = req.headers;
	const token = authorization?.replace("Bearer ", "");
	if (!token) return res.sendStatus(401);
	try {
		const session = await db.collection("sessions").findOne({ token });
		if (!session) return res.sendStatus(401);

		const movementsUser = await db
			.collection("movements")
			.find({ userId: session.userId })
			.toArray();
		res.send(movementsUser);
	} catch {
		res.sendStatus(500);
	}
};
export { addMovement, userMovements };
