import { Tool, ToolMetadata, ToolRegistry } from "./@types/tool.js";

export const registry: ToolRegistry = {};

export const register = (tool: Tool<any>, metadata: ToolMetadata) => {
  registry[metadata.name] = { tool, metadata };
};

export const get = (name: string): Tool<any> | undefined => {
  return registry[name]?.tool;
};

export const listMetadata = (): ToolMetadata[] => {
  return Object.values(registry).map((entry) => entry.metadata);
};
