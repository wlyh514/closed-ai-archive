import { Readable } from "node:stream";
export const gameIdToRoomId = (gameId: string) => `game-${gameId}`;

/**
 * Copied from: https://github.com/gfortaine/openai-node/blob/master/stream.ts
 * Credits to https://github.com/gfortaine
 */
namespace OpenAIStream {
  export async function* chunksToLines(
    chunksAsync: AsyncIterable<Buffer>
  ): AsyncIterable<string> {
    let previous = "";
    for await (const chunk of chunksAsync) {
      const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      previous += bufferChunk;
      let eolIndex;
      while ((eolIndex = previous.indexOf("\n")) >= 0) {
        // line includes the EOL
        const line = previous.slice(0, eolIndex + 1).trimEnd();
        if (line === "data: [DONE]") break;
        if (line.startsWith("data: ")) yield line;
        previous = previous.slice(eolIndex + 1);
      }
    }
  }

  export async function* linesToMessages(
    linesAsync: AsyncIterable<string>
  ): AsyncIterable<string> {
    for await (const line of linesAsync) {
      const message = line.substring("data :".length);
      yield message;
    }
  }
}

export async function* streamCompletion(
  stream: Readable
): AsyncGenerator<string, void, undefined> {
  yield* OpenAIStream.linesToMessages(OpenAIStream.chunksToLines(stream));
}

export function randomlySelectNFrom<T>(arr: T[], N: number): T[] {
  const selectedItems: T[] = [];
  if (N >= arr.length) {
    return [...arr];
  }
  while (selectedItems.length < N) {
    const item = arr[Math.floor(Math.random() * arr.length)];
    if (!selectedItems.includes(item)) {
      selectedItems.push(item);
    }
  }
  return selectedItems;
}
