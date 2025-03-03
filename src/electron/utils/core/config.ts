import { binary } from "../path/resolver.js";
import { readFileSync } from "fs";
import { configPath as configFilePath, secretsPath } from "../path/resolver.js";
import { getLogger } from "./logger.js";
import { AppConfig } from "../../@types/config.js";

const logger = getLogger();

const readConfig = (): AppConfig => {
  try {
    const configPath = configFilePath();
    logger.info(`Reading config from path: ${configPath}`);
    if (!configPath) {
      throw new Error("Config path not found");
    }
    const configFile = readFileSync(configPath, "utf-8");
    return JSON.parse(configFile) as AppConfig;
  } catch (error) {
    logger.error(error);
    return {} as AppConfig;
  }
};

let config: AppConfig;
export const appConfig = (): AppConfig => {
  if (!config) {
    config = readConfig();
    config = {
      ...config,
    };
  }
  return config;
};

const readSecrets = () => {
  try {
    const secretsFile = readFileSync(secretsPath(), "utf-8");
    return JSON.parse(secretsFile);
  } catch (error) {
    logger.error("Failed to read secrets:", error);
    return {};
  }
};
const secrets = readSecrets();

export const secret = (key: string): any => {
  const keys = key.split(".");
  let result = secrets;
  for (const k of keys) {
    if (result && typeof result === "object" && k in result) {
      result = result[k];
    } else {
      return null;
    }
  }
  return result;
};
