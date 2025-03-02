import { BrowserWindow } from "electron";
import { ipcMainHandle, ipcMainOn } from "./utils/event/mapper.js";
import { getLogger } from "./utils/core/logger.js";

const logger = getLogger();

export const registerEvents = (
  app: Electron.App,
  mainWindow: BrowserWindow
) => {
  ipcMainHandle("getZipFile", (batchId: string, fileName: string) => {
    try {
      // return s3ZipExtraction(batchId, fileName);
    } catch (error) {
      logger.error(error);
    }
    return {} as any;
  });

  handleFrameEvents(mainWindow);
  handleCloseEvents(app, mainWindow);
};

export const handleFrameEvents = (mainWindow: BrowserWindow) => {
  ipcMainOn("sendFrameAction", (payload: FrameWindowAction) => {
    switch (payload) {
      case "CLOSE":
        mainWindow.close();
        break;
      case "MAXIMIZE":
        mainWindow.maximize();
        break;
      case "MINIMIZE":
        mainWindow.minimize();
        break;
    }
  });
};

function handleCloseEvents(app: Electron.App, mainWindow: BrowserWindow) {
  let willClose = false;

  app.on("window-all-closed", () => {
    app.quit();
  });

  mainWindow.on("close", (e) => {
    if (willClose) {
      return;
    }
    app.quit();
    e.preventDefault();
    mainWindow.hide();
    if (app.dock) {
      app.dock.hide();
    }
  });

  app.on("before-quit", () => {
    willClose = true;
  });

  mainWindow.on("show", () => {
    willClose = false;
  });
}
