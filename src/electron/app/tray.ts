import { BrowserWindow, Menu, Tray, app } from "electron";
import path from "path";
import { asset } from "../utils/path/resolver.js";

export function createTray(mainWindow: BrowserWindow) {
  const tray = new Tray(asset("icon.png"));

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Show",
        click: () => {
          mainWindow.show();
          if (app.dock) {
            app.dock.show();
          }
        },
      },
      {
        label: "Quit",
        click: () => app.quit(),
      },
    ])
  );
}
