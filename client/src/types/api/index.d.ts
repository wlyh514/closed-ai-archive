/**
 * For shared type definitions between frontend and backend.
 */
declare module "api" {
  export type UserId = number;
  export type GameId = string;

  export interface ErrorResponseBody {
    error: {
      msg: string;
      status?: number;
    };
  }

  export interface UserClientView {
    name: string;
    id: number;
  }

  // POST /users/signup
  export interface SignupRequestBody {
    username: string;
    email: string;
    password: string;
  }

  export interface SignupResponseBody {
    user: UserClientView;
  }

  // POST /users/signin
  export interface SigninRequestBody {
    identifier: string; // email or username
    password: string;
  }

  export interface SigninResponseBody {
    user: UserClientView;
  }

  // GET /users/me
  export interface MeResponseBody {
    user: UserClientView;
  }

  // POST /games
  export interface GameInfo {
    gameId: string;
    started: boolean;
    preview?: string;
    bgImgURL?: string;
  }

  export interface CreateGameRequestBody {
    options: {
      themes?: string[];
    };
  }

  export interface CreateGameResponseBody {
    game: GameInfo;
  }

  export interface GetMyGamesResponseBody {
    games: GameInfo[];
  }

  export interface GetGameHistoryResponseBody {
    messages: GameEvents[];
  }

  export interface DeleteGameResponseBody {
    game: GameInfo;
  }

  export interface GetGameBlockedResponseBody {
    blocked: boolean;
  }

  // Interaction
  export interface UserGameInput {
    msg: string;
  }

  export interface MessageRaw {
    type: "player" | "server";
    author: string;
    sentAt: string; // .getTime()
    content: string; // plain text
  }

  export interface Message extends MessageRaw {
    sentAt: Date;
  }

  export type GameEvents = MessageRaw | null;

  // Socket.io
  export interface ServerToClientEvents {
    error: ({ error: ErrorResponseBody }) => void;
    "game-message": (msg: MessageRaw) => void;
    "message-stream": (data: string) => void; // stream-id|packet-id|delta
    "game-block": () => void;
    "game-unblock": () => void;
    "background-change": (url: string) => void;
  }

  export interface ClientToServerEvents {
    "user-game-input": (action: UserGameInput) => void;
    "start-game": () => void;
  }
}
