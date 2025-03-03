import { detectRoute } from "../services/ai/ai.router.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { secret } from "../utils/core/config.js";
import { getToolsMarkdown } from "../tools/index.js";
import { promptPath } from "../utils/path/resolver.js";
import fs from "fs";

export type AnswerRequest = {
  query: string;
  rawAnswer: string;
};
const promptFilePath = promptPath("answer.prompt.md");
const prompt = fs.readFileSync(promptFilePath, "utf-8");

export const answer = async (request: AnswerRequest) => {
  let formattedPrompt = prompt.replace("{{query}}", request.query);
  formattedPrompt = formattedPrompt.replace("{{rawAnswer}}", request.rawAnswer);
  const genAI = new GoogleGenerativeAI(secret("GOOGLE_API_KEY"));
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Generate content using Gemini
  const result = await model.generateContent([
    {
      text: formattedPrompt,
    }
  ]);

  const responseText = result.response.text();
  return responseText
};
