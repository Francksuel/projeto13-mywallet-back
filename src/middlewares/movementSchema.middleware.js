import joi from "joi";
import { stripHtml } from "string-strip-html";

const movementSchema = joi.object({
	valor: joi.number().positive().required(),
	description: joi.string().min(1).required(),
	type: joi.string().valid("entrada", "saída").required(),
});

const movementValidationSchema = (req, res, next) => {
	const movement = req.body;
	if (movement.valor && movement.description) {
		movement.valor = stripHtml(movement.valor).result.trim();
		movement.description = stripHtml(movement.description).result.trim();
	}
	const movementValidation = movementSchema.validate(movement, {
		abortEarly: false,
	});

	if (movementValidation.error) {
		const errors = movementValidation.error.details.map(
			(error) => error.message
		);
		return res.status(422).send(errors);
	}
	res.locals.movement = movement;
	next();
};
export { movementValidationSchema };
