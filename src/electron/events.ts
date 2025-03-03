import { BrowserWindow } from "electron";
import { getLogger } from "./utils/core/logger.js";
import { registerHandlers } from "./handlers/index.js";

const logger = getLogger();

export const registerEvents = (
  app: Electron.App,
  mainWindow: BrowserWindow
) => {
  registerHandlers(app, mainWindow);
  handleCloseEvents(app, mainWindow);
};

export const handleCloseEvents = (
  app: Electron.App,
  mainWindow: BrowserWindow
) => {
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
};

// export const validateEventFrame = (frame: WebFrameMain) => {
//   if (isDev() && new URL(frame.url).host === "localhost:5123") {
//     return;
//   }
//   if (frame.url !== pathToFileURL(uiRoot()).toString()) {
//     throw new Error("Malicious event");
//   }
// };
