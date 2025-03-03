export type LLMResponse = {
  query: string;
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
          result?: any;
          error?: string;
        };
      };
      completed?: boolean;
    }>;
  };
  response?: string;
  error?: string;
};
