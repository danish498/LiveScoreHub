import express from "express";
import cors from "cors";
import { matcherRoute } from "./src/routes/matches.js";
import { attachWebSocketServer } from "./src/ws/server.js";
import http from "http";
import { commentaryRoute } from "./src/routes/commentary.js";

const PORT = Number(process.env.PORT) || 9090;
const HOST = process.env.HOST || "localhost";
const app = express();
app.use(cors());

const server = http.createServer(app);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use("/matches", matcherRoute);
app.use("/matches/:id/commentary", commentaryRoute);
const { broadcastMatchCreated, broadcastCommentary } =
  attachWebSocketServer(server);

app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;

server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;

  console.log(`Server is running at ${baseUrl}`);
  console.log(
    `WebSocket server is running at ${baseUrl.replace("http", "ws")}/ws`,
  );
});
