import { orchestrate } from "../handlers/orchestrator.js";

export type ElectronHandlers = {
  orchestrate: typeof orchestrate;
};
