import { MethodNotAllowedError } from "./error";

export type GraphQLParameters = {
  query: string | null;
  variables: { readonly [key: string]: string } | null;
  operationName: string | null;
  raw: boolean;
};

const contentTypeGraphQL = "application/graphql";
const contentTypeJSON = "application/json";
const contentTypePost = "application/x-www-form-urlencoded";

function parseFromGetRequest(request: Request): GraphQLParameters {
  const { searchParams } = new URL(request.url);
  const variables = searchParams.get("variables");

  const params: GraphQLParameters = {
    query: searchParams.get("query"),
    variables: variables ? JSON.parse(variables) : null,
    operationName: searchParams.get("operationName"),
    raw: searchParams.has("raw"),
  };

  return params;
}

async function parseFromPostRequest(
  request: Request
): Promise<GraphQLParameters> {
  const body = await request.text();

  switch (request.headers.get("content-type")) {
    case contentTypeGraphQL:
      return {
        query: body,
        variables: null,
        operationName: null,
        raw: false,
      };
    case contentTypeJSON:
      try {
        const json = JSON.parse(body);
        return {
          query: json.query ?? null,
          variables: json.variables ?? null,
          operationName: json.operationName ?? null,
          raw: false,
        };
      } catch (err) {
        throw new Error("Invalid JSON body");
      }
    case contentTypePost:
      /* eslint-disable no-case-declarations */
      const searchParams = new URLSearchParams(body);
      const variables = searchParams.get("variables");
      /* eslint-enable no-case-declarations */

      return {
        query: searchParams.get("query"),
        variables: variables ? JSON.parse(variables) : null,
        operationName: searchParams.get("operationName"),
        raw: false,
      };
    default:
      return {
        query: null,
        variables: null,
        operationName: null,
        raw: false,
      };
  }
}

export async function parseGraphQLParameters(
  request: Request
): Promise<GraphQLParameters> {
  switch (request.method.toUpperCase()) {
    case "GET":
      return parseFromGetRequest(request);
    case "POST":
      return parseFromPostRequest(request);
    default:
      throw new MethodNotAllowedError(
        `${request.method.toUpperCase()} is not Allowed`
      );
  }
}
