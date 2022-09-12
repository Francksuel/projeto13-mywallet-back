import { mongo } from "../database/db.js";

let db = await mongo();

const addMovement = async (req, res) => {
	try {
		const movement = res.locals.movement;
		await db.collection("movements").insertOne({
			userId: res.locals.userId,
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
	try {
		const movementsUser = await db
			.collection("movements")
			.find({ userId: res.locals.userId })
			.toArray();
		res.send(movementsUser);
	} catch {
		res.sendStatus(500);
	}
};
export { addMovement, userMovements };