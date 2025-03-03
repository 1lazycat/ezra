import { detectRoute } from "../services/ai/ai.router.js";
import { createReadStream } from "fs";
import { Readable } from "stream";

export type OrchestratorRequest = {
  query: string;
  audioStream?: Readable;
};

export const orchestrate = async (request: OrchestratorRequest) => {
  if (request.audioStream) {
    // Process the audio stream and convert it to text
    const userQuery = await convertAudioToText(request.audioStream);
    return await detectRoute(userQuery);
  } else {
    return await detectRoute(request.query);
  }
};

const convertAudioToText = async (audioStream: Readable): Promise<string> => {
  // Implement the logic to convert audio stream to text
  // This can be done using a speech-to-text service like Google Speech-to-Text, AWS Transcribe, etc.
  // For now, we'll return a placeholder string
  return "Converted text from audio";
};
