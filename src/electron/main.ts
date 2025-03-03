import {
  app,
  BrowserWindow,
  Menu,
  systemPreferences,
  Notification,
  ipcMain,
} from "electron";
import { uiRoot, preloadPath } from "./utils/path/resolver.js";
import { isDev } from "./utils/core/env.js";
import { createTray } from "./app/tray.js";
// import { createMenu } from "./app/menu.js";
import { registerEvents } from "./events.js";
import from "./tools/index.js";

async function createWindow() {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: preloadPath(),
    },
    frame: true,
    darkTheme: true,
    title: "Ezra",
    // icon: asset("icon.png"),
  });
  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(uiRoot());
    Menu.setApplicationMenu(null);
    // mainWindow.webContents.openDevTools();
  }
  registerEvents(app, mainWindow);
  createTray(mainWindow);
  // createMenu(mainWindow);
  const micStatus = systemPreferences.getMediaAccessStatus("microphone");
  new Notification({
    title: "Microphone Access",
    body: `Microphone access status: ${micStatus}`,
  }).show();

  registerEvents(app, mainWindow);
}

app.whenReady().then(createWindow);
