import mongo from "../database/db.js";
import joi from "joi";
import { stripHtml } from "string-strip-html";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

let db = await mongo();

const userSchema = joi.object({
	name: joi.string().min(3).required(),
	email: joi.string().email().required(),
	password: joi.string().min(4).required(),
});

async function repeatEmail(email) {
	const users = await db.collection("users").find().toArray();
	return users.filter((element) => element.email === email);
}
const signUp = async (req, res) => {
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
}
const signIn = async (req, res) => {
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
}


export {signUp, signIn};