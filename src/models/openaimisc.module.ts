import constants from "../constants";
import { openai } from "./model";
import errors from "../errors";

/**
 * Util functions that uses openai
 */
namespace OpenAIMisc {
  export const verifyThemes = async (themes: string[]): Promise<boolean[]> => {
    console.log(`Verifying themes: ${JSON.stringify(themes)}`);

    let resp;
    try {
      resp = await openai.createCompletion({
        model: "text-davinci-003",
        temperature: 0,
        top_p: 1,
        frequency_penalty: 0,
        prompt: constants.openaiPrompts.THEMES_VALIDATION.replace(
          "{%WORDS%}",
          JSON.stringify(themes)
        ),
      });
    } catch (err) {
      throw new errors.OpenAIError();
    }

    let results: boolean[];
    try {
      results = JSON.parse(resp.data.choices[0].text!);
    } catch (err) {
      throw new errors.IncorrectAIResponse();
    }
    console.log(`Got response: ${results}`);

    return results;
  };
}

export default OpenAIMisc;
