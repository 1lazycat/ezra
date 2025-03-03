export type ToolArgs = {
  [key: string]: any;
};

export type ToolResponse<T> = {
  data: T;
  error?: any;
};

export type ToolMetadata = {
  name: string;
  description: string;
  args: {
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }[];
  returns: string;
};

export type Tool<T> = (...args: any[]) => Promise<ToolResponse<T>>;

export type ToolRegistry = {
  [name: string]: {
    tool: Tool<any>;
    metadata: ToolMetadata;
  };
};
