import dotenv from "dotenv";
import express from "express";
import { createServer } from "node:http"; //connects express with socket.io
dotenv.config();

// import {Server} from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import { connectToSoSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

const server = createServer(app);
const io = connectToSoSocket(server);
app.set("port", process.env.PORT || 8080);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));
app.use("/api/v1/users", userRoutes);
const start = async () => {
  const connectionDb = await mongoose.connect(process.env.MONGO_URI);
  console.log(`Mongo connected : ${connectionDb.connection.host}`);

  server.listen(app.get("port"), () => {
    console.log("Listening on port 8080");
  });
};

start();
