import { binary } from "../path/resolver.js";
import { readFileSync } from "fs";
import { configPath as configFilePath } from "../path/resolver.js";
import { getLogger } from "./logger.js";

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
      tools: {
        sevenZip: {
          path: config.tools?.sevenZip?.path || binary("7zr.exe"),
        },
      },
    };
  }
  return config;
};
