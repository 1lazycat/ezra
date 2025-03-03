const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
  orchestrate: (request: any) => electron.ipcRenderer.invoke("orchestrate", request),
});
