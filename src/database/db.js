import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
const mongo = async () => {
	let db;
	try {
		db = await mongoClient.db("mywalletapi");
		return db;
	} catch (error) {
		return error;
	}
};
export { mongo };