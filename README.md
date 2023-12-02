An archived repository for the "closed-ai" project. Names are removed for privacy concerns.

User credentials for testing: 

- Username: `voidptr_t`
- Password: `123$%^qweRTY`

# Closed AI

**Group name**: Closed AI

**Project title**: Closed AI

**Demo video**: [https://youtu.be/G-E5PLLEyk0](https://youtu.be/G-E5PLLEyk0)

**Deployed at**: [https://closed-ai.bookflyconstant.com](https://closed-ai.bookflyconstant.com)

**Group members**:

| **Name** | **Student Number** |
| -------------- | ------------------------ |
| Name1          | 0000000000               |
| Name2          | 0000000000               |
| Name3          | 0000000000               |

**Description of the web application**: Our project will be centered around the openai GPT-3 text completion API, providing an AI generated text driven adventure experience for our end users. We will experiment on different text prompts, discover ones that lead to interesting gameplay and expose them as configure options for our users. Our user will be able to:

- Create an account and log in.
- Log in using external accounts.
- Configure an adventure.
- Interact with the adventure using natural language.
- See AI generated background image (1 image per 3 interactions).
- Resume from a saved game.
- Receive a push notification when a piece of story is fully generated.
- ~~Create a multiplayer adventure.~~
- ~~Join multiplayer adventures created by other players.~~

**Complexity points**

- OpenAI API (1) for generating the adventure
- SocketIO (2) for bi-directional conversation in multiplayer adventures
- Dall-E (1) for generating images
- Sendgrid (2) for sending confirmation emails
- Push notifications (3) for sending notifications upon generation complete

**Plans for each phase**

- Alpha (March 6)

  - Implement single player adventure
    - Find out text-prompts that lead to 'good' stories and gameplay
    - Implement adventure creation and configuration
    - Implement user-AI interaction loop
  - Find out how to make GPT-3 generate story for multiplayer adventure
  - Implement the user login system. This means implementing:
    - Account creation
    - Email verification
    - Account login/logout and backend authentication
- Beta (March 20)

  - Implement multiplayer lobby system. This means implementing:
    - Multiplayer adventure creation
    - Joining and leaving a multiplayer adventure
    - Viewing a list of all currently available multiplayer adventures
  - Setup in-game chat channel using SocketIO for multiplayer adventures
  - Integrate with Auth0 to enable logging in with external accounts
- Final (April 3)

  - Setup push notification for multiplayer adventures
  - Polish and debugging

# For Developers

## Setting up

Backend:

- Install [pnpm](https://pnpm.io) (pnpm is basically npm but better. It saves space using hardlinks).
- Run `pnpm install` to install dependencies.
- Copy `./.env.example` to `./.env`, complete required params.
- Run `pnpm push-db` to generate database file and schema type definitions. This should also be ran every time after updating `./prisma/schema.prisma`.
- Run `pnpm dev` to start the development backend server using nodemon.

Frontend:

- `cd client`.
- Run `pnpm install` to install dependencies.
- Copy `./.env.example` to `./.env`, complete required params.
- Run `pnpm start` to start the react dev server.

**Please run `pnpm format` to format the code before pushing!**
