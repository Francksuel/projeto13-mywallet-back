import express from "express";
import cors from "cors";
import joi from "joi";
import bcrypt from "bcrypt";
import { stripHtml } from "string-strip-html";
import { v4 as uuid } from "uuid";
import mongo from "./database/db.js";

const userSchema = joi.object({
	name: joi.string().min(3).required(),
	email: joi.string().email().required(),
	password: joi.string().min(4).required(),
});
const movementSchema = joi.object({
	valor: joi.number().positive().required(),
	description: joi.string().min(1).required(),
	type: joi.string().valid("entrada", "saída").required(),
});

let db = await mongo();

const app = express();
app.use(cors());
app.use(express.json());

async function repeatEmail(email) {
	const users = await db.collection("users").find().toArray();
	return users.filter((element) => element.email === email);
}

app.post("/sign-up", async (req, res) => {
	const registry = req.body;
	if (registry.name && registry.email) {
		registry.name = stripHtml(registry.name).result.trim();
		registry.email = stripHtml(registry.email).result.trim();
	}
	const userValidation = userSchema.validate(registry, { abortEarly: false });
	if (userValidation.error) {
		const errors = userValidation.error.details.map((error) => error.message);
		return res.status(422).send(errors);
	}
	try {
		const isRepeatEmail = await repeatEmail(registry.email).then((repeat) => {
			return repeat.length;
		});
		if (isRepeatEmail !== 0) {
			return res.status(409).send("Já existe um usuário com esse e-mail!");
		}
		const passwordHash = bcrypt.hashSync(registry.password, 10);
		await db.collection("users").insertOne({
			name: registry.name,
			email: registry.email,
			password: passwordHash,
		});
		res.sendStatus(201);
	} catch {
		res.sendStatus(500);
	}
});

app.post("/sign-in", async (req, res) => {
	const { email, password } = req.body;
	try {
		const user = await db.collection("users").findOne({ email });
		if (!user) return res.status(404).send("Usuário e/ou senha inválidos");

		const passwordChecked = await bcrypt.compare(password, user.password);
		if (passwordChecked) {
			const token = uuid();
			await db.collection("sessions").insertOne({
				userId: user._id,
				token,
			});
			res.send({ token, name: user.name });
		} else {
			res.status(404).send("Usuário e/ou senha inválidos");
		}
	} catch {
		res.sendStatus(500);
	}
});

app.post("/movements", async (req, res) => {
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
});

app.get("/movements", async (req, res) => {
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
});

export default app;
