import { Tool, ToolMetadata, ToolRegistry } from "./@types/tool.js";
import { calcualtor, metadata as calcMetadata } from "./calc/calc.tool.js";

export const registry: ToolRegistry = {
  calculator: { tool: calcualtor, metadata: calcMetadata },
};

export const add = (tool: Tool<any>, metadata: ToolMetadata) => {
  registry[metadata.name] = { tool, metadata };
};

export const get = (name: string): Tool<any> | undefined => {
  return registry[name]?.tool;
};

export const listMetadata = (): ToolMetadata[] => {
  return Object.values(registry).map((entry) => entry.metadata);
};

export const getToolsMarkdown = (): string => {
  const tools = listMetadata();
  let markdown = "";

  tools.forEach((tool) => {
    markdown += `## ${tool.name}\n\n`;

    if (tool.description) {
      markdown += `${tool.description}\n\n`;
    }

    if (tool.description)
      markdown += `**Description:** ${tool.description}\n\n`;

    // Arguments section
    if (tool.args && Array.isArray(tool.args) && tool.args.length > 0) {
      markdown += `### Arguments\n`;
      tool.args.forEach((param) => {
        const paramName = param.name;
        const paramDesc = param.description || "";
        const required =
          !("required" in param) || param.required
            ? " (required)"
            : " (optional)";
        const type = param.type ? ` \`${param.type}\`` : "";
        markdown += `- **${paramName}**${type}${required}: ${paramDesc}\n`;
      });
      markdown += "\n";
    }
  });

  return markdown;
};
