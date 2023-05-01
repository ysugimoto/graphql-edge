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
import { GraphQLLogger, discardLogger } from "./logging";
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

export type Hooks = {
  response?: (body: GraphQLResponse) => GraphQLResponse;
};

export type Option = {
  typeDefs: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolvers: Record<string, any>;
  errorOnEither?: boolean;
  hooks?: Hooks;
  logger?: GraphQLLogger;
};

export type GraphQLResponse = FormattedExecutionResult;

export function graphqlHandler({
  typeDefs,
  resolvers,
  errorOnEither = false,
  hooks,
  logger,
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

  const logging = logger || discardLogger;

  return async (request: Request) => {
    const start = Date.now();

    try {
      const { query, variables, operationName } = await parseGraphQLParameters(
        request
      );
      if (query === "") {
        const error = new QueryNotProvidedError(
          "Query is not provided in request"
        );
        logging({
          query,
          operationName: operationName || "",
          variables: variables || {},
          error: error,
          elapsedTime: Date.now() - start,
        });
        throw error;
      }
      const doc = parse(new Source(query ?? "", "GraphQL request"));
      const docErrors = validate(schema, doc, specifiedRules);
      if (docErrors.length > 0) {
        const error = new QueryValidationError(
          `GraphQL Validation error: ${JSON.stringify(docErrors)}`
        );
        logging({
          query,
          operationName: operationName || "",
          variables: variables || {},
          error: error,
          elapsedTime: Date.now() - start,
        });
        throw error;
      }
      if (request.method === "GET") {
        const op = getOperationAST(doc, operationName);
        if (op && op.operation !== "query") {
          const error = new UnexpectedOperationError(
            `Operation ${op.operation} can accept only from POST request`
          );
          logging({
            query,
            operationName: operationName || "",
            variables: variables || {},
            error: error,
            elapsedTime: Date.now() - start,
          });
          throw error;
        }
      }

      const result = await execute({
        schema,
        document: doc,
        contextValue: request,
        variableValues: variables,
        operationName,
      });

      // If errorOnEither option is true, raise 500 Internal Server Error if either query failed.
      if (errorOnEither && result.errors) {
        const error = new Error(JSON.stringify(result.errors.map(formatError)));
        logging({
          query,
          operationName: operationName || "",
          variables: variables || {},
          error: error,
          elapsedTime: Date.now() - start,
        });
        throw error;
      }

      const formatted: FormattedExecutionResult = {
        ...result,
        errors: result.errors?.map(formatError),
      };

      // If hooks are provided, call it
      const response =
        hooks && hooks.response ? hooks.response(formatted) : formatted;

      logging({
        query,
        operationName: operationName || "",
        variables: variables || {},
        error: null,
        elapsedTime: Date.now() - start,
      });

      return new Response(JSON.stringify(response), {
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
