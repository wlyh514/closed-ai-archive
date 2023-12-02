import { ErrorResponseBody } from "api";
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { ClosedAISocket } from ".";

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

export const authGuard: Middleware = (req, res, next) => {
  console.log(req.session);
  if (!req.session.userId) {
    respondWithError(res, 401, "Please sign in to use this endpoint. ");
    return;
  }

  next();
};

export const validationErrorHandler: Middleware = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    respondWithError(res, 422, result.array({ onlyFirstError: true })[0].msg);
    return;
  }
  next();
};

export const respondWithError = (
  res: Response,
  code: number,
  msg: string = "Unknown error. "
) => {
  const body: ErrorResponseBody = {
    error: {
      msg,
    },
  };
  res.status(code).json(body).end();
};

export const uncaughtErrorHandler: Middleware = (_, res, next) => {
  try {
    next();
  } catch (err) {
    console.error(err);
    respondWithError(res, 500);
  }
};

export const sendErrorToSocket = (
  socket: ClosedAISocket,
  code: number,
  msg: string = "Unknown error."
) => {
  socket.emit("error", {
    error: {
      msg: msg,
      status: code,
    },
  });
};

export const verifyGuard: Middleware = (req, res, next) => {
  console.log(req.session);
  if (!req.session.verified) {
    respondWithError(res, 401, "Please verify to use this endpoint. ");
    return;
  }

  next();
};
