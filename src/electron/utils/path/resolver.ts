import path from "path";
import { app } from "electron";
import { isDev } from "../core/env.js";

const devRoot = () => path.join(app.getAppPath(), "..", "..", "src");

export const binary = (fileName: string) =>
  isDev()
    ? path.join(devRoot(), "binaries", fileName)
    : path.join(app.getAppPath(), "..", "src", "binaries", fileName);

export const preloadPath = () =>
  isDev()
    ? path.join(app.getAppPath(), "preload.cjs")
    : path.join(app.getAppPath(), "dist", "electron", "preload.cjs");

export const uiRoot = () =>
  isDev()
    ? path.join(app.getAppPath(), "dist", "fe", "index.html")
    : path.join(app.getAppPath(), "dist", "fe", "index.html");

export const asset = (fileName: string) =>
  isDev()
    ? path.join(devRoot(), "assets", fileName)
    : path.join(app.getAppPath(), "src", "assets", fileName);

export const configPath = () =>
  isDev()
    ? path.join(devRoot(), "electron", "config.json")
    : path.join(app.getAppPath(), "..", "config.json");

export const secretsPath = () =>
  isDev()
    ? path.join(devRoot(), "electron", "secrets.json")
    : path.join(app.getAppPath(), "..", "secrets.json");

export const promptPath = (fileName: string) => {
  return path.join(devRoot(), "electron", "data", "prompts", fileName);
};
