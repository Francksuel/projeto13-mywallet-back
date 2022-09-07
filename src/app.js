import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient } from "mongodb";
import joi from "joi";
import bcrypt from "bcrypt";
import { stripHtml } from "string-strip-html";
dotenv.config();

const userSchema = joi.object({
	name: joi.string().min(3).required(),
	email: joi.string().email().required(),
	password: joi.string().min(4).required(),
});

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
	db = mongoClient.db("mywalletapi");
});

const app = express();
app.use(cors());
app.use(express.json());

async function repeatName(name) {
	const users = await db.collection("users").find().toArray();
	return users.filter((element) => element.name === name);
}
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
	const isRepeatName = await repeatName(registry.name).then((repeat) => {
		return repeat.length;
	});
	if (isRepeatName !== 0) {
		return res.status(409).send("O nome de usuário já existe!");
	}
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
});

export default app;
