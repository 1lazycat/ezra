import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  orchestrate: (request: any) => ipcRenderer.invoke("orchestrate", request),
});
