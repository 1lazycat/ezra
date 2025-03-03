import { detectRoute } from "../services/ai/ai.router.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { secret } from "../utils/core/config.js";
import { getToolsMarkdown } from "../tools/index.js";
import { promptPath } from "../utils/path/resolver.js";
import fs from "fs";

export type OrchestratorRequest = {
  query?: string;
  audioData?: number[]; // Changed from audioStream to audioData array
};
const promptFilePath = promptPath("planner.prompt.md");
const prompt = fs.readFileSync(promptFilePath, "utf-8");

export const orchestrate = async (request: OrchestratorRequest) => {
  const tools = getToolsMarkdown();
  let formattedPrompt = prompt.replace("{{tools}}", tools);
  formattedPrompt = formattedPrompt.replace(
    "{{userInput}}",
    "Refer attached audio file for user input."
  );

  if (request.audioData) {
    try {
      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(secret("GOOGLE_API_KEY"));
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Convert number array back to Uint8Array and then to base64
      const audioData = new Uint8Array(request.audioData);
      const base64AudioFile = Buffer.from(audioData).toString("base64");

      // Generate content using Gemini
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: "audio/mp3",
            data: base64AudioFile,
          },
        },
        {
          text: formattedPrompt,
        },
      ]);

      const responseText = result.response.text();
      // Extract JSON from markdown if present
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      let parsedResponse = responseText;

      if (jsonMatch && jsonMatch[1]) {
        try {
          parsedResponse = jsonMatch[1];
        } catch (jsonError) {}
      }
      return parsedResponse;
    } catch (error) {
      console.error("Error processing audio with Gemini:", error);
      throw error;
    }
  } else if (request.query) {
    return await detectRoute(request.query);
  } else {
    throw new Error("Neither audio data nor query provided");
  }
};
