export type GraphQLOperationLog = {
  query: string | null;
  operationName: string;
  variables: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  error: Error | null;
  elapsedTime: number;
};

export type GraphQLLogger = (logging: GraphQLOperationLog) => void;
// eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
export const discardLogger = (logging: GraphQLOperationLog) => {};
