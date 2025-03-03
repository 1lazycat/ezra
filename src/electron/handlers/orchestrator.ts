import { detectRoute } from "../services/ai/ai.router.js";

export type OrchestratorRequest = {
  query: string;
};

export const orchestrate = async (request: OrchestratorRequest) => {
  return await detectRoute(request.query);
};
