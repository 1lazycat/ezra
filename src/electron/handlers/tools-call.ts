import { get as getTool } from "../tools/index.js";
import { ToolArgs, ToolResponse } from "../tools/@types/tool.js";

export const executeTool = async (
  toolName: string,
  args: ToolArgs
): Promise<ToolResponse<any>> => {
  const tool = getTool(toolName);

  if (!tool) {
    return JSON.stringify({
      data: null,
      error: `Tool ${toolName} not found`,
    });
  }

  try {
    const result = await tool(args);
    return JSON.stringify({ data: result.data });
  } catch (error) {
    return JSON.stringify({ data: null, error });
  }
};
