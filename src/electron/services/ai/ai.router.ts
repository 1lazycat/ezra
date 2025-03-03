import axios from "axios";
import fs from "fs";
import { secret } from "../../utils/core/config.js";
import { promptPath } from "../../utils/path/resolver.js";

const routerPromptPath = promptPath("router.prompt.md");

export const detectRoute = async (userQuery: string) => {
  try {
    let prompt = fs.readFileSync(routerPromptPath, "utf-8");
    prompt = prompt.replace("{{user_query}}", userQuery);
    const data = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${secret(
        "GOOGLE_API_KEY"
      )}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  } catch (error) {
    console.error("Error calling Google Gen AI:", error);
    throw error;
  }
};
