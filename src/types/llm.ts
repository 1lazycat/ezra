export type LLMResponse = {
  plan: {
    steps: Array<{
      id: string;
      description: string;
      resources: string[];
      dependencies: string[];
      tool: {
        [toolName: string]: {
          args: {
            [argName: string]: any;
          };
        };
      };
    }>;
  };
  response?: string;
  error?: string;
};
