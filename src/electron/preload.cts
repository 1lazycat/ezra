import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  orchestrate: (request: any) => ipcRenderer.invoke("orchestrate", request),
  execute: (toolName: string, args: any[]) =>
    ipcRenderer.invoke("tools:execute", toolName, args),
  answer: (request: any) => ipcRenderer.invoke("answer", request),
});
