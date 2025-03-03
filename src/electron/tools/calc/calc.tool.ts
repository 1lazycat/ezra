import { ToolMetadata, ToolResponse, ToolArgs } from "../@types/tool.js";

export const calcualtor = async (args: {
  a: number;
  b: number;
  operation: string;
} satisfies ToolArgs ): Promise<ToolResponse<number>> => {
  const { a, b, operation } = args;
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
      description: "Operation to perform. Allowed values: +, -, *, /",
    },
  ],
  returns: "number",
};
