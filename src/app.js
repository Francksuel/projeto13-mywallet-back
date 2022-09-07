import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import {MongoClient} from 'mongodb';

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
	db = mongoClient.db('mywalletapi');
});

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req,res)=>{
    res.sendStatus(201);
})

export default app;