import mongo from "../database/db.js";

const checkUser = async (req, res, next) => {
	try {
		let db = await mongo();

		const { authorization } = req.headers;
		const token = authorization?.replace("Bearer ", "");
		if (!token) return res.sendStatus(401);

		const session = await db.collection("sessions").findOne({ token });
		if (!session) return res.sendStatus(401);
		res.locals.userId = session.userId;
		next();
	} catch {
		return res.sendStatus(500);
	}
};
export { checkUser };
