import express from "express";
import { matcherRoute } from "./src/routes/matches.js";
import { attachWebSocketServer } from "./src/ws/server.js";
import http from "http";

const PORT = Number(process.env.PORT) || 9090;
const HOST = process.env.HOST || "localhost";
const app = express();

const server = http.createServer(app);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use("/matches", matcherRoute);

const { broadMatchCreate } = attachWebSocketServer(server);

app.locals.broadMatchCreate = broadMatchCreate;

server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;

  console.log(`Server is running at ${baseUrl}`);
  console.log(
    `WebSocket server is running at ${baseUrl.replace("http", "ws")}/ws`,
  );
});
