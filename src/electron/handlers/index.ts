import { BrowserWindow, ipcMain } from "electron";
import { orchestrate, OrchestratorRequest } from "./orchestrator.js";
import { ToolArgs } from "../tools/@types/tool.js";
import { executeTool } from "./tools-call.js";
import { answer, AnswerRequest } from "./answer.js";

export const registerHandlers = (
  app: Electron.App,
  mainWindow: BrowserWindow
) => {
  ipcMain.handle(
    "orchestrate",
    async (event, request: OrchestratorRequest) => await orchestrate(request)
  );
  ipcMain.handle(
    "tools:execute",
    async (_, toolName: string, args: ToolArgs) =>
      await executeTool(toolName, args)
  );
  ipcMain.handle(
    "answer",
    async (_, request: AnswerRequest) => await answer(request)
  );
};
