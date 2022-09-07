import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient } from "mongodb";
import joi from "joi";
import bcrypt from "bcrypt";
import { stripHtml } from "string-strip-html";
import { v4 as uuid } from "uuid";

dotenv.config();

const userSchema = joi.object({
	name: joi.string().min(3).required(),
	email: joi.string().email().required(),
	password: joi.string().min(4).required(),
});
const movementSchema = joi.object({
	valor: joi.number().positive().required(),
	description: joi.string().min(1).required(),
	type: joi.string().valid("entrada", "saida").required(),
});

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
	db = mongoClient.db("mywalletapi");
});

const app = express();
app.use(cors());
app.use(express.json());

async function repeatEmail(email) {
	const users = await db.collection("users").find().toArray();
	return users.filter((element) => element.email === email);
}

app.post("/sign-up", async (req, res) => {
	const registry = req.body;
	const userValidation = userSchema.validate(registry, { abortEarly: false });
	if (userValidation.error) {
		const errors = userValidation.error.details.map((error) => error.message);
		return res.status(422).send(errors);
	} else {
		registry.name = stripHtml(registry.name).result.trim();
		registry.email = stripHtml(registry.email).result.trim();
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
			res.send(token);
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
