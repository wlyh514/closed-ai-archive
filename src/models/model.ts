/**
 * Shared resources
 */

import { PrismaClient } from "@prisma/client";
import { Configuration, OpenAIApi } from "openai";
import constants from "../constants";
export const prisma = new PrismaClient();

const openaiConfig = new Configuration({
  apiKey: constants.secrets.OPENAI,
});
export const openai = new OpenAIApi(openaiConfig);
