import express, { Router, json } from "express";
import cors from "cors";
import session from "express-session";
import http from "http";
import { EventWebhook, EventWebhookHeader } from "@sendgrid/eventwebhook";
import { createClient as createRedisClient } from "redis";
import { BroadcastOperator, Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import RedisStore from "connect-redis";

import AuthController from "./controllers/auth.controller";
import constants from "./constants";
import GamesController from "./controllers/games.controller";
import Auth from "./models/auth.model";
import { ClientToServerEvents, ServerToClientEvents } from "api";
import events from "./models/games/events.model";
import games from "./models/games/games.model";
import { gameIdToRoomId } from "./utils";
import PushController from "./controllers/push.controller";

const app = express();
const api = Router();

const server = http.createServer(app);

const pubClient = createRedisClient({ url: constants.redisURL });
const subClient = pubClient.duplicate();
const sessionClient = pubClient.duplicate();
const redisStore = new RedisStore({
  client: sessionClient,
  prefix: "closed-ai-session",
});

export type ClosedAISocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents
>;
export type ClosedAISocket = Socket<ClientToServerEvents, ServerToClientEvents>;
export type ClosedAISocketBroadcast = BroadcastOperator<
  ServerToClientEvents,
  any
>;

const io: ClosedAISocketServer = new Server(server, {
  cors: {
    origin: constants.DOMAIN,
    credentials: true,
  },
});

// middlewares
const corsMiddleware = cors({
  origin: constants.DOMAIN,
  credentials: true,
});

const sessionMiddleware = session({
  name: "closed-ai",
  secret: constants.secrets.SESSION,
  store: redisStore,
  cookie: {
    maxAge: constants.SESSION_LIFESPAN,
    // domain: "localhost:3000"
  },
  resave: false,
  saveUninitialized: true,
});

app.use((req, _, next) => {
  console.log(`${req.method} ${req.url} ${req.headers["cookie"]}`);
  next();
});
// Sendgrid webhook needs raw
app.use((req, res, next) => {
  if (req.originalUrl === "/api/sendgrid/webhook") {
    next();
  } else {
    json()(req, res, next);
  }
});
// app.use(json());
app.use(corsMiddleware);
app.use(sessionMiddleware);

/**
 * As stated (here)[https://socket.io/how-to/use-with-express-session], express middlewares should be compatable.
 */
io.engine.use(sessionMiddleware as any);

api.get("/", (_, res) => {
  res.send(
    `This is the closed-ai backend api running on port ${constants.PORT}. `
  );
});

api.post(
  "/sendgrid/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const eventWebhook = new EventWebhook();
    const publicKey = eventWebhook.convertPublicKeyToECDSA(
      constants.sgWebhookKey
    );
    const signature =
      req.get(EventWebhookHeader.SIGNATURE()) ||
      "X-Twilio-Email-Event-Webhook-Signature";
    const timestamp =
      req.get(EventWebhookHeader.TIMESTAMP()) ||
      "X-Twilio-Email-Event-Webhook-Timestamp";
    const body = req.body;

    if (eventWebhook.verifySignature(publicKey, body, signature, timestamp)) {
      const events: any[] = JSON.parse(body);
      events.forEach((event) => {
        console.log(`Email to ${event.email} was ${event.event}.`);
      });
      res.status(200).send();
    } else {
      res.status(403).send();
    }
  }
);

// controllers
app.use("/users", AuthController.router);
app.use("/push", PushController.router);

app.use("/api", api);

api.use("/games", GamesController.router);

/**
 * A socket should only be used for a game.
 */
io.on("connect", async (socket: ClosedAISocket) => {
  if (!socket.request.session.userId) {
    socket.disconnect();
    return;
  }

  console.log(
    "socket push subscription",
    socket.request.session.pushSubscription
  );

  const sessionId: string = socket.request.session.id;
  const user = await Auth.getUserById(socket.request.session.userId!);
  if (!user) {
    socket.disconnect();
    return;
  }

  const game = await games.getGameByPlayer(user.id);
  if (game) {
    socket.join(gameIdToRoomId(game.id));
  }

  const getUser = () => user;

  socket.join(`session-${sessionId}`); // The room that contains all sockets from this session.

  /**
   * Reload session info for every incomming packet
   */
  socket.use((ev, next) => {
    console.log(ev);
    socket.request.session.reload((err) => {
      // Kill the socket if session or user changed
      if (
        (user && socket.request.session.id !== sessionId) ||
        socket.request.session.userId !== user?.id
      ) {
        socket.disconnect();
        return;
      }

      if (err) {
        socket.disconnect();
      } else {
        next();
      }
    });
  });

  GamesController.registerSocket(socket, getUser);
});

AuthController.setSocketIO(io);
GamesController.setSocketIO(io);
events.setSocketIO(io);
games.setSocketIO(io);

Promise.all([
  pubClient.connect(),
  subClient.connect(),
  sessionClient.connect(),
]).then(() => {
  console.log(`Connected to redis server at ${constants.redisURL}. `);

  io.adapter(createAdapter(pubClient, subClient));
  server.listen(constants.PORT, () => {
    console.log(`Closed AI server listening on PORT ${constants.PORT}`);
  });
});
