import session from "express-session";
import { Request, Response, NextFunction } from "express";
import { Session } from "express-session";
import openai from "openai";
import { Readable } from "node:stream";

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

declare module "http" {
  interface IncomingMessage {
    session: Session & {
      userId?: number;
      verified?: boolean;
      pushSubscription?: string;
    };
  }
}
// TODO: Copy Paste
declare module "openai" {
  interface CreateChatCompletionResponse extends Readable {}
  interface StreamResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
      delta: {
        content?: string;
      };
      index: number;
      finish_reason: "stop" | "length" | "content-filter" | null;
    }[];
  }
}
