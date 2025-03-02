const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
  subscribeChangeView: (callback) =>
    ipcOn("changeView", (view) => {
      callback(view);
    }),
  getZipFile: (...args) => ipcInvoke("getZipFile", ...args),
  sendFrameAction: (payload) => ipcSend("sendFrameAction", [payload]),
} satisfies Window["electron"]);

function ipcInvoke<Key extends keyof EventMapping>(
  key: Key,
  ...args: EventMapping[Key]["payload"]
): EventMapping[Key]["response"] {
  return electron.ipcRenderer.invoke(key, ...(args as any));
}

function ipcOn<Key extends keyof EventMapping>(
  key: Key,
  callback: (...payload: EventMapping[Key]["payload"]) => void
) {
  const cb = (_: Electron.IpcRendererEvent, payload: any) =>
    callback(...payload);
  electron.ipcRenderer.on(key, cb);
  return () => electron.ipcRenderer.off(key, cb);
}

function ipcSend<Key extends keyof EventMapping>(
  key: Key,
  payload: EventMapping[Key]["payload"]
) {
  electron.ipcRenderer.send(key, payload);
}
