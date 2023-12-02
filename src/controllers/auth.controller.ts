import { Router } from "express";
import { body } from "express-validator";
import { Prisma, User } from "@prisma/client";

import {
  SigninRequestBody,
  SigninResponseBody,
  SignupRequestBody,
  SignupResponseBody,
  UserClientView,
} from "api";
import Auth from "../models/auth.model";
import {
  authGuard,
  respondWithError,
  validationErrorHandler,
} from "../middlewares";
import constants from "../constants";
import { ClosedAISocketServer } from "..";

namespace AuthController {
  let io: ClosedAISocketServer;
  export const setSocketIO = (_io: ClosedAISocketServer) => (io = _io);

  export const router = Router();

  const toUserClientView = (user: User): UserClientView => ({
    id: user.id,
    name: user.name,
  });

  router.post(
    "/signup",
    body("username")
      .isString()
      .isLength(constants.user.name.length)
      .matches(constants.user.name.REGEX),
    body("password")
      .isString()
      .isLength(constants.user.password.length)
      .matches(constants.user.password.REGEX),
    body("email").isString().isEmail(),
    validationErrorHandler,
    async (req, res) => {
      const { username, email, password }: SignupRequestBody = req.body;

      let user: User;
      try {
        user = await Auth.addUser(email, username, password);
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          if ((err.meta?.target as string[])[0] === "name") {
            respondWithError(res, 409, "Username in use");
          } else {
            respondWithError(res, 409, "Email in use");
          }
        } else {
          console.error(err);
          respondWithError(res, 500);
        }
        return;
      }

      await Auth.sendVerificationEmail(email, username, user.token);

      const body: SignupResponseBody = {
        user: toUserClientView(user),
      };

      req.session.userId = user.id;
      req.session.verified = user.verified;
      req.session.save((err) => {
        res.status(201).json(body).end();
      });
    }
  );

  router.post(
    "/signin",
    body("identifier").isString(),
    body("password").isString(),
    validationErrorHandler,
    async (req, res) => {
      const { identifier, password }: SigninRequestBody = req.body;
      const user = await Auth.getUserByEmailOrName(identifier);
      if (!user) {
        respondWithError(res, 404, "User not found. ");
        return;
      }

      if (!Auth.verifyPassword(user, password)) {
        respondWithError(res, 401, "Incorrect password. ");
        return;
      }

      const body: SigninResponseBody = {
        user: toUserClientView(user),
      };

      req.session.userId = user.id;
      req.session.verified = user.verified;
      req.session.save((err) => {
        res.status(201).json(body).end();
      });
    }
  );

  router.get("/signout", authGuard, async (req, res) => {
    req.session.userId = undefined;
    req.session.verified = undefined;
    req.session.pushSubscription = undefined;
    req.session.save((_) => {
      io.in(`session-${req.session.id}`).disconnectSockets();
      res.status(200).end();
    });
  });

  router.get("/me", authGuard, async (req, res) => {
    const user = await Auth.getUserById(req.session.userId!);
    if (!user) {
      respondWithError(res, 404, "User does not exist. ");
      return;
    }
    res.json({
      user: toUserClientView(user),
    });
  });

  router.patch("/:token/verify", async (req, res) => {
    const foundUser = await Auth.getUserByToken(req.params.token);
    if (!foundUser) {
      respondWithError(res, 404, "Cannot Verify User. ");
      return;
    }

    if (foundUser.verified) {
      respondWithError(res, 403, "Cannot Verify User. ");
      return;
    }

    let user: User;
    try {
      user = await Auth.verifyUser(foundUser.id);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        respondWithError(res, 404, "Cannot Verify User. ");
        return;
      } else {
        console.error(err);
        respondWithError(res, 500, "Cannot Verify User. ");
      }
      return;
    }

    req.session.userId = user.id;
    req.session.verified = user.verified;
    res.json({
      user: toUserClientView(user),
    });
  });
}

export default AuthController;
