import {
  CreateGameResponseBody,
  DeleteGameResponseBody,
  ErrorResponseBody,
  GameId,
  GetGameBlockedResponseBody,
  GetGameHistoryResponseBody,
  GetMyGamesResponseBody,
} from "api";
import constants from "../constants";

export const createSingleplayerGame = async (
  themes: String[]
): Promise<CreateGameResponseBody | ErrorResponseBody> => {
  try {
    const res = await fetch(`${constants.SERVER_HOST}/api/games`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        themes: themes,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      const err: ErrorResponseBody = await res.json();
      err.error.status = res.status;
      return err;
    }
    return (await res.json()) as CreateGameResponseBody;
  } catch (err) {
    console.error(err);
    return {
      error: { msg: "Connection Error. " },
    };
  }
};

export const getMyGames = async (): Promise<
  GetMyGamesResponseBody | ErrorResponseBody
> => {
  try {
    const res = await fetch(`${constants.SERVER_HOST}/api/games/my`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) {
      if (res.status === 404) {
        return {
          games: [],
        };
      }

      const err: ErrorResponseBody = await res.json();
      err.error.status = res.status;
      return err;
    }
    return (await res.json()) as GetMyGamesResponseBody;
  } catch (err) {
    console.error(err);
    return {
      error: { msg: "Connection Error. " },
    };
  }
};

export const getGameHistory = async (
  gameId: GameId
): Promise<GetGameHistoryResponseBody | ErrorResponseBody> => {
  try {
    const res = await fetch(
      `${constants.SERVER_HOST}/api/games/${gameId}/history`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    if (!res.ok) {
      const err: ErrorResponseBody = await res.json();
      err.error.status = res.status;
      return err;
    }
    return (await res.json()) as GetGameHistoryResponseBody;
  } catch (err) {
    console.error(err);
    return {
      error: { msg: "Connection Error. " },
    };
  }
};

export const deleteGame = async (
  gameId: GameId
): Promise<DeleteGameResponseBody | ErrorResponseBody> => {
  try {
    const res = await fetch(`${constants.SERVER_HOST}/api/games/${gameId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const err: ErrorResponseBody = await res.json();
      err.error.status = res.status;
      return err;
    }
    return (await res.json()) as DeleteGameResponseBody;
  } catch (err) {
    console.error(err);
    return {
      error: { msg: "Connection Error. " },
    };
  }
};

export const getGameBlocked = async (
  gameId: GameId
): Promise<GetGameBlockedResponseBody | ErrorResponseBody> => {
  try {
    const res = await fetch(
      `${constants.SERVER_HOST}/api/games/${gameId}/history`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    if (!res.ok) {
      const err: ErrorResponseBody = await res.json();
      err.error.status = res.status;
      return err;
    }
    return (await res.json()) as GetGameBlockedResponseBody;
  } catch (err) {
    console.error(err);
    return {
      error: { msg: "Connection Error. " },
    };
  }
};
