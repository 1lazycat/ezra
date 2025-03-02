import { app, BrowserWindow, Menu } from "electron";
import { uiRoot, preloadPath, asset } from "./utils/path/resolver.js";
import { isDev } from "./utils/core/env.js";
import { createTray } from "./app/tray.js";
// import { createMenu } from "./app/menu.js";
import { registerEvents } from "./events.js";

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: preloadPath(),
    },
    frame: true,
    darkTheme: true,
    title: "S3 Manager",
    icon: asset("icon.png"),
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
});
