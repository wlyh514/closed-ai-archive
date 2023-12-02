import prompts from "./prompts.json";
import dotenv from "dotenv";
dotenv.config();

const envNotFound = (field: string) => {
  throw new Error(`Env variable ${field} not found. `);
};

const constants = {
  PORT: Number(process.env.PORT) || 5000,
  secrets: {
    SESSION: process.env.SESSION_SECRET || envNotFound("SESSION_SECRET"),
    OPENAI: process.env.OPENAI_SECRET || envNotFound("OPENAI_SECRET"),
    SENDGRID: process.env.SENDGRID_SECRET || envNotFound("SENDGRID_SECRET"),
  },
  SESSION_LIFESPAN:
    Number(process.env.SESSION_LIFESPAN) || 2 * 24 * 3600 * 1000,
  auth: {
    delimiter: "$",
  },
  user: {
    name: {
      length: {
        min: 3,
        max: 15,
      },
      REGEX: /^[A-Za-z0-9_]+$/,
    },
    password: {
      length: {
        min: 5,
        max: 64,
      },
      REGEX: /^(?=.*[A-Z])(?=.*[!@#$&_])(?=.*[0-9]).*$/,
    },
  },
  openaiPrompts: prompts,
  sendgridEmail: process.env.EMAIL || "email@mail.com",
  sendgridTemplate: process.env.SG_TEMPLATE,
  DOMAIN: process.env.DOMAIN || "http://localhost:3000",
  sgWebhookKey: process.env.SG_WEBHOOK_SECRET || "",

  vapidDetails: {
    publicKey: process.env.VAPID_PUBLIC || envNotFound("VAPID_PUBLIC"),
    privateKey: process.env.VAPID_PRIVATE || envNotFound("VAPID_PRIVATE"),
    subject: process.env.VAPID_SUBJECT || envNotFound("VAPID_SUBJECT"),
  },

  themes: {
    samples: [
      "Action",
      "Adventure",
      "Comedy",
      "Crime",
      "Drama",
      "Fantasy",
      "Historical",
      "Horror",
      "Mystery",
      "Romance",
      "Science Fiction",
      "Thriller",
      "Lovecraftian",
      "Cyberpunk",
    ],
    gameCreation: {
      min: 0,
      max: 4,
    },
  },
  redisURL: process.env.REDIS_URL || "redis://localhost:6379",
};

export default constants;
