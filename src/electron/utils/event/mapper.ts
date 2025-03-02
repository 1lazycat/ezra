import { ipcMain, WebContents, WebFrameMain } from "electron";
import { pathToFileURL } from "url";
import { uiRoot } from "../path/resolver.js";
import { isDev } from "../core/env.js";

export function ipcMainHandle<Key extends keyof EventMapping>(
  key: Key,
  handler: (
    ...args: EventMapping[Key]["payload"]
  ) => EventMapping[Key]["response"]
) {
  ipcMain.handle(key, (event, ...args) => {
    console.log("Received args:", args);
    if (event.senderFrame) validateEventFrame(event.senderFrame);
    return handler(...args);
  });
}

export function ipcMainOn<Key extends keyof EventMapping>(
  key: Key,
  handler: (...args: EventMapping[Key]["payload"]) => void
) {
  ipcMain.on(key, (event, payload) => {
    if (event.senderFrame) validateEventFrame(event.senderFrame);
    return handler(payload);
  });
}

export function ipcWebContentsSend<Key extends keyof EventMapping>(
  key: Key,
  webContents: WebContents,
  payload: EventMapping[Key]["payload"]
) {
  webContents.send(key, payload);
}

export function validateEventFrame(frame: WebFrameMain) {
  if (isDev() && new URL(frame.url).host === "localhost:5123") {
    return;
  }
  if (frame.url !== pathToFileURL(uiRoot()).toString()) {
    throw new Error("Malicious event");
  }
}
