/// <reference types="@fastly/js-compute" />
import type {
  FormattedExecutionResult,
} from "graphql";
import {
  makeExecutableSchema,
} from "@graphql-tools/schema";
import { parseGraphQLParameters } from "./parameters";
import {
  formatError,
  validateSchema,
  validate,
  parse,
  execute,
  Source,
  specifiedRules,
  getOperationAST,
} from "graphql";

export type Option = {
  typeDefs: string;
  resolvers: any;
};

export function graphqlHandler({
  typeDefs,
  resolvers,
}: Option): (request: Request) => Promise<Response> {

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  return async (request: Request) => {
    try {
      const { query, variables, operationName } = await parseGraphQLParameters(request);
      if (query === "") {
        throw new Error("query is not provided");
      }
      const schemaErrors = validateSchema(schema);
      if (schemaErrors.length > 0) {
        throw new Error(`Schema Validation error: ${JSON.stringify(schemaErrors)}`);
      }
      const doc = parse(new Source(query ?? "", "GraphQL request"));
      const docErrors = validate(schema, doc, specifiedRules);
      if (docErrors.length > 0) {
        throw new Error(`GraphQL Validation error: ${JSON.stringify(schemaErrors)}`);
      }
      if (request.method === "GET") {
        const op = getOperationAST(doc, operationName);
        if (op && op.operation !== "query") {
          throw new Error(`Operation ${op.operation} can accept only from POST request`);
        }
      }

      const result = await execute({
        schema,
        document: doc,
        contextValue: request,
        variableValues: variables,
        operationName,
      });

      const formatted: FormattedExecutionResult = {
        ...result,
        errors: result.errors?.map(formatError),
      };

      return new Response(JSON.stringify(formatted), {
        status: 200,
        headers: new Headers({
          "Content-Type": "application/json"
        }),
      });
    } catch (err) {
      const message = (err instanceof Error) ? err.message : err as string;
      return new Response(message, {
        status: 500,
        headers: new Headers({
          "Content-Type": "text/plain"
        }),
      });
    }
  };
}
