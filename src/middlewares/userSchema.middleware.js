import joi from "joi";
import { stripHtml } from "string-strip-html";

const userSchema = joi.object({
	name: joi.string().min(3).required(),
	email: joi.string().email().required(),
	password: joi.string().min(4).required(),
});

const userValidationSchema = (req, res, next) => {
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
	res.locals.registry = registry;
	next();
};
export { userValidationSchema };