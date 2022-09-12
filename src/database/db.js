import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
export default async function mongo() {
	let db;
	try {
		db = await mongoClient.db("mywalletapi");
		return db;
	} catch (error) {		
		return error;
	}
}
