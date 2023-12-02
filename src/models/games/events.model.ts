import {
  ChatCompletionRequestMessage,
  CreateChatCompletionResponse,
  StreamResponse,
} from "openai";

import { GameEvents as GameEventsClient, GameId, MessageRaw } from "api";
import { ClosedAISocketServer } from "../..";
import { streamCompletion } from "../../utils";
import { openai } from "../model";
import constants from "../../constants";

const gameIdToRoomId = (gameId: string) => `game-${gameId}`;

namespace events {
  let io: ClosedAISocketServer;
  export const setSocketIO = (_io: ClosedAISocketServer) => (io = _io);

  /**
   * Basic building block of a game's context.
   */
  export abstract class GameEvent {
    protected gameRoom = "";

    constructor(protected gameId: string) {
      this.gameRoom = gameIdToRoomId(gameId);
    }

    public abstract toOpenAIMessage(): ChatCompletionRequestMessage | null;
    public abstract toClientView(): GameEventsClient;
    public abstract get showInHistory(): boolean;
    public abstract get usedTokens(): number;
    public abstract broadcast(): void | Promise<void>;
  }

  /**
   * Event sent by players (or the server).
   */
  export abstract class Action extends GameEvent {
    public async process(messages: ChatCompletionRequestMessage[]) {
      const responses = await this.getResponses(messages);
      this.responses = responses;
    }
    protected abstract getResponses(
      messages: ChatCompletionRequestMessage[]
    ): Promise<Response[]>;

    public responses: Response[] = [];

    protected _processed: boolean = false;
    public get processed() {
      return this._processed;
    }
    public get requireStreamMode(): boolean {
      return false;
    }
  }

  /**
   * Event received from AI.
   */
  export abstract class Response extends GameEvent {}

  export class PlayerTextAction extends Action {
    constructor(gameId: string, private name: string, private content: string) {
      super(gameId);
    }

    public toOpenAIMessage(): ChatCompletionRequestMessage | null {
      return {
        role: "user",
        name: this.name,
        content: this.content,
      };
    }

    public broadcast(): void {
      io.in(this.gameRoom).emit("game-message", this.toClientView());
    }

    protected async getResponses(
      messages: ChatCompletionRequestMessage[]
    ): Promise<Response[]> {
      const resp = await openai.createChatCompletion(
        {
          messages,
          model: "gpt-3.5-turbo",
          temperature: 0.7,
          top_p: 1,
          presence_penalty: 0.5,
          frequency_penalty: 0.5,
          stream: true,
        },
        { responseType: "stream" }
      );

      return [new StreamStoryResponse(this.gameId, resp.data)];
    }
    public get showInHistory(): boolean {
      return true;
    }
    public get usedTokens(): number {
      throw new Error("Method not implemented.");
    }
    public toClientView(): MessageRaw {
      return {
        type: "player",
        author: this.name,
        content: this.content,
        sentAt: new Date().toISOString(),
      };
    }
  }

  export class StreamStoryResponse extends Response {
    private content: string = "";
    private fullyLoaded: boolean = false;
    private static streamIdAcc = 0;
    private streamId = -1;
    private packetId = 0;

    constructor(gameId: string, private stream: CreateChatCompletionResponse) {
      super(gameId);
      this.streamId = StreamStoryResponse.streamIdAcc++;
    }

    private getPrefix() {
      return `${this.streamId}|${this.packetId}|`;
    }

    public async broadcast(): Promise<void> {
      for await (const msgRaw of streamCompletion(this.stream)) {
        try {
          const msg = JSON.parse(msgRaw) as StreamResponse;
          const delta = msg.choices[0].delta.content || "";
          this.content += delta;
          this.packetId++;
          io.in(this.gameRoom).emit("message-stream", this.getPrefix() + delta);
        } catch (err) {
          console.error(err);
        }
      }
      this.fullyLoaded = true;
    }

    public toOpenAIMessage(): ChatCompletionRequestMessage | null {
      if (!this.fullyLoaded) {
        return null;
      }
      return {
        role: "assistant",
        content: this.content,
      };
    }
    public toClientView(): MessageRaw {
      return {
        type: "server",
        author: "server",
        content: this.content,
        sentAt: new Date().toISOString(),
      };
    }
    public get showInHistory(): boolean {
      return this.fullyLoaded;
    }
    public get usedTokens(): number {
      throw new Error("Method not implemented.");
    }
  }

  export class StartStoryAction extends Action {
    protected async getResponses(
      messages: ChatCompletionRequestMessage[]
    ): Promise<Response[]> {
      const resp = await openai.createChatCompletion(
        {
          messages,
          model: "gpt-3.5-turbo",
          temperature: 0.7,
          top_p: 1,
          presence_penalty: 0.5,
          frequency_penalty: 0.5,
          stream: true,
        },
        { responseType: "stream" }
      );

      return [new StreamStoryResponse(this.gameId, resp.data)];
    }
    public toOpenAIMessage(): ChatCompletionRequestMessage | null {
      return null;
    }
    public toClientView(): GameEventsClient {
      return null;
    }
    public get showInHistory(): boolean {
      return false;
    }
    public get usedTokens(): number {
      return 0;
    }
    public broadcast(): void | Promise<void> {}
  }

  export class GenerateBackgroundAction extends Action {
    constructor(gameId: GameId, private themes?: string) {
      super(gameId);
    }

    protected async getResponses(
      messages: ChatCompletionRequestMessage[]
    ): Promise<Response[]> {
      const res = await openai.createChatCompletion({
        messages,
        model: "gpt-3.5-turbo",
        temperature: 0.2,
        top_p: 1,
        presence_penalty: 0.5,
        frequency_penalty: 0.5,
      });

      let prompt = res.data.choices[0].message?.content!;
      prompt = this.themes ? `${prompt}, ${this.themes}` : prompt;
      console.log("prompt get", prompt);

      const imageRes = await openai.createImage({
        prompt,
        n: 1,
        response_format: "url",
      });

      console.log("url get: ", imageRes.data.data[0].url!);

      return [
        new GenerateBackgroundResponse(this.gameId, imageRes.data.data[0].url!),
      ];
    }
    public toOpenAIMessage(): ChatCompletionRequestMessage | null {
      return {
        role: "user",
        name: "narrator",
        content: constants.openaiPrompts.GET_SURROUNDINGS,
      };
    }
    public toClientView(): GameEventsClient {
      return null;
    }
    public get showInHistory(): boolean {
      return false;
    }
    public get usedTokens(): number {
      return 0;
    }
    public broadcast(): void | Promise<void> {}
  }

  export class GenerateBackgroundResponse extends Response {
    constructor(gameId: GameId, private _url: string) {
      super(gameId);
    }

    public get url() {
      return this._url;
    }

    public toOpenAIMessage(): ChatCompletionRequestMessage | null {
      return null;
    }
    public toClientView(): GameEventsClient {
      return null;
    }
    public get showInHistory(): boolean {
      return false;
    }
    public get usedTokens(): number {
      return 0;
    }
    public broadcast(): void | Promise<void> {
      // Here sent user the original url, but the image should be stored somewhere locally
      // since the image will expire on openai's server.
      console.log("Broadcasted");
      io.in(gameIdToRoomId(this.gameId)).emit("background-change", this._url);
    }
  }
}

export default events;
