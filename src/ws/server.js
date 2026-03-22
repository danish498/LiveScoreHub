import { WebSocket, WebSocketServer } from "ws";

function subscribe() {}

function sendJson(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }
  socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) {
      continue;
    }
    sendJson(client, payload);
  }
}

export const attachWebSocketServer = (server) => {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  function broadMatchCreate(match) {
    broadcast(wss, { type: "match_create", match });
  }

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  wss.on("connection", async (socket, req) => {
    console.log("Client connected");
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.subscriptions = new Set();

    sendJson(socket, {
      type: "welcome",
      message: "Welcome to the live score server",
    });

    socket.on("message", (data) => {
      if (typeof handleMessage === "function") {
        handleMessage(socket, data);
      } else {
        console.warn("handleMessage is not defined");
      }
    });

    socket.on("close", () => {
      if (typeof cleanupSubscriptions === "function") {
        cleanupSubscriptions(socket);
      }
    });

    socket.on("error", (err) => {
      console.error(err);
      socket.terminate();
    });
  });

  return { wss, broadMatchCreate };
};
