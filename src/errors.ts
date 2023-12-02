namespace errors {
  export class ActionQueueBlocked extends Error {}
  export class IncorrectAIResponse extends Error {}
  export class GameFull extends Error {}
  export class GameStarted extends Error {}
  export class PlayerNotInGame extends Error {}
  export class OwnerOnly extends Error {}
  export class UnsupportedAction extends Error {}
  export class OpenAIError extends Error {}
}

export default errors;
