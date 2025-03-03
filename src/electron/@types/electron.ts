import { orchestrate, OrchestratorRequest } from "../handlers/orchestrator.js";

export type ElectronHandlers = {
  orchestrate: (request: OrchestratorRequest) => Promise<string>;
};
