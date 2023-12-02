import { Router } from "express";
import { User } from "@prisma/client";
import { body } from "express-validator";
import webPush from "web-push";

import Games from "../models/games/games.model";
import {
  authGuard,
  uncaughtErrorHandler,
  respondWithError,
  sendErrorToSocket,
  verifyGuard,
  validationErrorHandler,
} from "../middlewares";
import Auth from "../models/auth.model";
import {
  CreateGameResponseBody,
  UserGameInput,
  GetMyGamesResponseBody,
  GetGameHistoryResponseBody,
  DeleteGameResponseBody,
  GetGameBlockedResponseBody,
} from "api";
import errors from "../errors";
import { ClosedAISocket, ClosedAISocketServer } from "..";
import events from "../models/games/events.model";
import constants from "../constants";
import OpenAIMisc from "../models/openaimisc.module";
import { randomlySelectNFrom } from "../utils";

namespace GamesController {
  let io: ClosedAISocketServer;
  export const setSocketIO = (_io: ClosedAISocketServer) => (io = _io);

  export const router = Router(); // /api/games

  // Request should be sent AFTER creating the socketIO connection.
  router.post(
    "/",
    authGuard,
    verifyGuard,
    body("themes").optional().isArray(constants.themes.gameCreation),
    body("themes.*").isString(),
    validationErrorHandler,
    uncaughtErrorHandler,
    async (req, res) => {
      const user = await Auth.getUserById(req.session.userId!);

      if (!user) {
        respondWithError(res, 401, "Unknown user. ");
        return;
      }

      if (await Games.getGameByPlayer(user.id)) {
        respondWithError(res, 409, "User is currently in a game. ");
        return;
      }

      // Story themes
      let themes: string[] = [];
      if (req.body.themes instanceof Array && req.body.themes.length > 0) {
        const unverifiedThemes = (req.body.themes as string[]).filter(
          (theme) => !constants.themes.samples.includes(theme)
        );

        if (unverifiedThemes.length > 0) {
          try {
            const invalidIndex = (
              await OpenAIMisc.verifyThemes(unverifiedThemes)
            ).indexOf(false);
            if (invalidIndex > -1) {
              respondWithError(
                res,
                422,
                `"${req.body.themes[invalidIndex]}" is not a valid story theme. `
              );
              return;
            }
          } catch (err) {
            respondWithError(res, 500, "Error connecting to openai.");
            return;
          }
        }
        themes = req.body.themes;
      } else {
        // Randomly select themes
        themes = randomlySelectNFrom(
          constants.themes.samples,
          Math.ceil(Math.random() * constants.themes.samples.length)
        );
      }

      const newGame = new Games.SimpleSinglePlayerGameWithBgImg(
        user.id,
        themes
      );
      Games.addGame(newGame);

      newGame.addPlayer(user.id);
      io.to(`session-${req.session.id}`).socketsJoin(`game-${newGame.id}`);

      const body: CreateGameResponseBody = {
        game: {
          gameId: newGame.id,
          started: newGame.started,
        },
      };
      res.json(body).end();
    }
  );

  /**
   * Get saved games.
   */
  router.get("/my", authGuard, verifyGuard, async (req, res) => {
    const game = await Games.getGameByPlayer(req.session.userId!);
    if (!game) {
      respondWithError(res, 404, "No games created. ");
      return;
    }
    const body: GetMyGamesResponseBody = {
      games: [
        {
          gameId: game.id,
          started: game.started,
          preview: game.getPreview(),
          bgImgURL: game.bgImgURL,
        },
      ],
    };
    res.json(body).end();
  });

  /**
   * Get history of the game.
   */
  router.get("/:gameId/history", authGuard, verifyGuard, async (req, res) => {
    const game = await Games.getGameByPlayer(req.session.userId!);
    if (!game) {
      respondWithError(res, 404, "Game not found. ");
      return;
    }
    if (!game.players.includes(req.session.userId!)) {
      respondWithError(res, 403, "You are not authorized to view this game. ");
      return;
    }

    const body: GetGameHistoryResponseBody = {
      messages: game.getHistory(),
    };
    res.json(body).end();
  });

  router.get("/:gameId/blocked", authGuard, async (req, res) => {
    const game = await Games.getGameByPlayer(req.session.userId!);
    if (!game) {
      respondWithError(res, 404, "Game not found. ");
      return;
    }
    if (!game.players.includes(req.session.userId!)) {
      respondWithError(res, 403, "You are not authorized to view this game. ");
      return;
    }
    const body: GetGameBlockedResponseBody = {
      blocked: game.blocked,
    };
    res.json(body).end();
  });

  router.delete("/:gameId", authGuard, verifyGuard, async (req, res) => {
    const game = await Games.getGameById(req.params.gameId);
    if (!game) {
      respondWithError(res, 404, "Game not found. ");
      return;
    }
    if (game.owner !== req.session.userId) {
      respondWithError(
        res,
        403,
        "You are not authorized to delete this game. "
      );
      return;
    }

    game.removePlayer(req.session.userId);
    Games.deleteGame(game);
    const body: DeleteGameResponseBody = {
      game: {
        gameId: game.id,
        started: game.started,
      },
    };
    res.json(body).end();
  });

  export const registerSocket = async (
    socket: ClosedAISocket,
    getUser: () => User
  ) => {
    socket.on("start-game", async () => {
      const game = await Games.getGameByPlayer(getUser().id);
      if (!game) {
        sendErrorToSocket(
          socket,
          404,
          "You are not currently in a game. Please join a game first. "
        );
        return;
      }
      if (game.started) {
        sendErrorToSocket(socket, 409, "Game already started. ");
      }

      try {
        socket.join(`game-${game.id}`);
        // Handle game initialization.
        game.init();
      } catch (err) {
        console.error(err);
        sendErrorToSocket(socket, 500);
      }
    });

    socket.on("user-game-input", async (action: UserGameInput) => {
      if (typeof action !== "object" || typeof action.msg !== "string") {
        sendErrorToSocket(socket, 422, "Incorrect format.");
        return;
      }

      const game = await Games.getGameByPlayer(getUser().id);
      if (!game) {
        sendErrorToSocket(
          socket,
          404,
          "You are not currently in a game. Please join a game first. "
        );
        return;
      }

      try {
        const textAction = new events.PlayerTextAction(
          game.id,
          getUser().name,
          action.msg
        );

        await game.handleUserAction(textAction);

        const pushSubscription = socket.request.session.pushSubscription;

        if (textAction instanceof events.PlayerTextAction && pushSubscription) {
          await webPush.sendNotification(
            JSON.parse(pushSubscription),
            JSON.stringify({
              title: "Story generation completed!",
            }),
            {
              vapidDetails: constants.vapidDetails,
            }
          );
        }
      } catch (err) {
        if (err instanceof errors.ActionQueueBlocked) {
          sendErrorToSocket(
            socket,
            409,
            "Generating response, please be patient. "
          );
        } else {
          console.error(err);
          sendErrorToSocket(socket, 500);
        }
        return;
      }
    });
  };
}

export default GamesController;
