import events from "./events.model";
import errors from "../../errors";

import { GameEvents as GameEventsClient } from "api";
import { ChatCompletionRequestMessage } from "openai";
import crypto from "crypto";
import Auth from "../auth.model";
import constants from "../../constants";
import { ClosedAISocketServer } from "../..";
import { gameIdToRoomId } from "../../utils";

namespace games {
  export type GameId = string;

  let io: ClosedAISocketServer;
  export const setSocketIO = (_io: ClosedAISocketServer) => (io = _io);

  const getPlayerNameById = async (id: Auth.UserId): Promise<string | null> => {
    const user = await Auth.getUserById(id);
    if (!user) {
      return null;
    }
    return user.name;
  };

  // maintain id->game mapping
  const gameIdToGame: Map<GameId, Game> = new Map();
  export const getGameById = async (id: GameId): Promise<Game | null> => {
    return gameIdToGame.get(id) || null;
  };
  export const addGame = async (game: Game) => {
    gameIdToGame.set(game.id, game);
  };
  export const deleteGame = async (game: Game) => {
    gameIdToGame.delete(game.id);
    for (const playerId of game.players) {
      deletePlayerFromGame(playerId);
    }
  };

  // maintain playerId->game mapping
  const playerIdToGame: Map<Auth.UserId, Game> = new Map();
  const addPlayerToGame = async (playerId: Auth.UserId, game: Game) => {
    playerIdToGame.set(playerId, game);
  };
  export const getGameByPlayer = async (
    playerId: Auth.UserId
  ): Promise<Game | null> => {
    return playerIdToGame.get(playerId) || null;
  };
  const deletePlayerFromGame = async (playerId: Auth.UserId) => {
    playerIdToGame.delete(playerId);
  };

  class EventChunk {
    public readonly id = crypto.randomUUID();
    private actions: events.Action[] = [];
    // Actions that does not contribute to the game's state, and does not block the receiving of
    // new client actions.
    private sideActions: events.Action[] = [];
    private actionQueueBlocked = false;

    constructor(private initPrompt: string) {}

    public async processAction(action: events.Action) {
      if (this.actionQueueBlocked) {
        throw new errors.ActionQueueBlocked();
      }
      this.actions.push(action);

      this.actionQueueBlocked = true;

      await action.process(this.getOpenAIMessages());
      for (const response of action.responses) {
        await response.broadcast();
      }

      this.actionQueueBlocked = false;
    }

    public async processSideAction(action: events.Action) {
      this.sideActions.push(action);

      const openAiMessages = this.getOpenAIMessages();
      const actionOpenAiMessage = action.toOpenAIMessage();
      if (actionOpenAiMessage) {
        openAiMessages.push(actionOpenAiMessage);
      }

      await action.process(openAiMessages);
      for (const response of action.responses) {
        await response.broadcast();
      }
    }

    private getOpenAIMessages(): ChatCompletionRequestMessage[] {
      const openAiMessages: ChatCompletionRequestMessage[] = [
        {
          role: "system",
          content: this.initPrompt,
        },
      ];
      for (const event of this.actions) {
        const eventMessage = event.toOpenAIMessage();
        if (eventMessage) {
          openAiMessages.push(eventMessage);
        }
        for (const response of event.responses) {
          const responseMessage = response.toOpenAIMessage();
          if (responseMessage) {
            openAiMessages.push(responseMessage);
          }
        }
      }
      return openAiMessages;
    }

    public getHistory(): GameEventsClient[] {
      const clientEvents: GameEventsClient[] = [];
      for (const event of this.actions) {
        if (event.showInHistory) {
          clientEvents.push(event.toClientView());
        }
        for (const response of event.responses) {
          if (response.showInHistory) {
            clientEvents.push(response.toClientView());
          }
        }
      }
      return clientEvents;
    }
  }

  abstract class Game {
    public readonly id = crypto.randomUUID();

    constructor(
      protected initPrompt: string,
      public owner: Auth.UserId,
      public maxPlayers: number
    ) {
      this.eventChunks.push(new EventChunk(this.initPrompt));
    }
    public bgImgURL: string = "";
    protected _started = false;
    public get started() {
      return this._started;
    }
    public async init() {
      if (this._started) {
        throw new errors.GameStarted();
      }
      this._started = true;
      await this._init();
    }
    protected abstract _init(): Promise<void>;

    public getHistory(): GameEventsClient[] {
      return this.eventChunks.map((c) => c.getHistory()).flat();
    }
    public abstract getPreview(): string;

    // Action handling
    protected eventChunks: EventChunk[] = [];
    protected get currentChunk(): EventChunk {
      return this.eventChunks.at(-1)!;
    }
    private _blocked = false;
    public get blocked() {
      return this._blocked;
    }
    protected set blocked(blocked: boolean) {
      this._blocked = blocked;
      const broadcast = io.in(gameIdToRoomId(this.id));
      if (blocked) {
        broadcast.emit("game-block");
      } else {
        broadcast.emit("game-unblock");
      }
    }
    public abstract handleUserAction(
      action: events.Action
    ): void | Promise<void>;

    // Player management
    public players: Auth.UserId[] = [];
    public addPlayer(playerId: Auth.UserId) {
      if (this.players.length > this.maxPlayers) {
        throw new errors.GameFull();
      }
      this.players.push(playerId);
      addPlayerToGame(playerId, this);
    }
    public removePlayer(playerId: Auth.UserId) {
      if (!this.players.includes(playerId)) {
        throw new errors.PlayerNotInGame();
      }
      this.players = this.players.splice(this.players.indexOf(playerId), 1);
      deletePlayerFromGame(playerId);
    }
  }

  export class SimpleSinglePlayerGameWithBgImg extends Game {
    private static interactionsPerBg = 3;
    private playerInteractionCount = 0;

    constructor(ownerId: Auth.UserId, public themes: String[]) {
      const systemPrompt =
        constants.openaiPrompts.SIMPLE_SINGLEPLAYER_GAME.replace(
          "{%THEMES%}",
          themes.join(", ")
        );
      console.log("story system prompt:", systemPrompt);
      super(systemPrompt, ownerId, 1);
    }

    public getPreview(): string {
      const history = this.currentChunk.getHistory();
      if (history.length > 0) {
        return history.at(-1)!.content;
      }
      return "Game not started.";
    }

    protected async _init(): Promise<void> {
      const startStoryAction = new events.StartStoryAction(this.id);
      this.blocked = true;
      await this.currentChunk.processAction(startStoryAction);
      this.blocked = false;
    }
    public async handleUserAction(action: events.Action): Promise<void> {
      if (!(action instanceof events.PlayerTextAction)) {
        throw new errors.UnsupportedAction();
      }
      this.blocked = true;
      await this.currentChunk.processAction(action);
      this.blocked = false;

      if (
        this.playerInteractionCount %
          SimpleSinglePlayerGameWithBgImg.interactionsPerBg ===
        0
      ) {
        const getNewImageAction = new events.GenerateBackgroundAction(
          this.id,
          this.themes.join(", ")
        );
        this.currentChunk
          .processSideAction(getNewImageAction)
          .then(
            () =>
              (this.bgImgURL = (
                getNewImageAction
                  .responses[0] as events.GenerateBackgroundResponse
              ).url)
          );
      }
      this.playerInteractionCount++;
    }

    public override addPlayer(playerId: number): void {
      if (playerId !== this.owner) {
        throw new errors.OwnerOnly();
      }
      super.addPlayer(playerId);
    }
  }
}

export default games;
