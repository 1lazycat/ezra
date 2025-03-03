import { ToolMetadata, ToolResponse } from "../@types/tool.js";

export const calcualtor = async (
  a: number,
  b: number,
  operation: string
): Promise<ToolResponse<number>> => {
  const result = await new Promise<number>((resolve, reject) => {
    try {
      switch (operation) {
        case "+":
          resolve(a + b);
          break;
        case "-":
          resolve(a - b);
          break;
        case "*":
          resolve(a * b);
          break;
        case "/":
          resolve(a / b);
          break;
        default:
          reject(new Error(`Invalid operation: ${operation}`));
      }
    } catch (error) {
      reject(error);
    }
  });
  return { data: result };
};

export const metadata: ToolMetadata = {
  name: "calculator",
  description: "Simple calculator tool",
  args: [
    { name: "a", type: "number", description: "First number" },
    { name: "b", type: "number", description: "Second number" },
    {
      name: "operation",
      type: "string",
      description: "Operation to perform",
    },
  ],
  returns: "number",
};
