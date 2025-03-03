import { BrowserWindow, ipcMain } from "electron";
import { orchestrate, OrchestratorRequest } from "./orchestrator.js";

export const registerHandlers = (
  app: Electron.App,
  mainWindow: BrowserWindow
) => {
  ipcMain.handle("orchestrate", (event, request: OrchestratorRequest) => orchestrate(request));
};
