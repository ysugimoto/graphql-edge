import type { FormattedExecutionResult } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { parseGraphQLParameters } from "./parameters";
import {
  QueryNotProvidedError,
  SchemaValidationError,
  QueryValidationError,
  UnexpectedOperationError,
  MethodNotAllowedError,
} from "./error";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolvers: Record<string, any>;
};

export function graphqlHandler({
  typeDefs,
  resolvers,
}: Option): (request: Request) => Promise<Response> {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });
  const schemaErrors = validateSchema(schema);
  if (schemaErrors.length > 0) {
    throw new SchemaValidationError(
      `Schema Validation error: ${JSON.stringify(schemaErrors)}`
    );
  }

  return async (request: Request) => {
    try {
      const { query, variables, operationName } = await parseGraphQLParameters(
        request
      );
      if (query === "") {
        throw new QueryNotProvidedError("Query is not provided in request");
      }
      const doc = parse(new Source(query ?? "", "GraphQL request"));
      const docErrors = validate(schema, doc, specifiedRules);
      if (docErrors.length > 0) {
        throw new QueryValidationError(
          `GraphQL Validation error: ${JSON.stringify(schemaErrors)}`
        );
      }
      if (request.method === "GET") {
        const op = getOperationAST(doc, operationName);
        if (op && op.operation !== "query") {
          throw new UnexpectedOperationError(
            `Operation ${op.operation} can accept only from POST request`
          );
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
          "Content-Type": "application/json",
        }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : (err as string);
      let statusCode = 500;
      if (
        err instanceof QueryNotProvidedError ||
        err instanceof QueryValidationError ||
        err instanceof UnexpectedOperationError
      ) {
        statusCode = 400;
      } else if (err instanceof MethodNotAllowedError) {
        statusCode = 405;
      }

      return new Response(message, {
        status: statusCode,
        headers: new Headers({
          "Content-Type": "text/plain",
        }),
      });
    }
  };
}
