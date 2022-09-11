/// <reference types="@fastly/js-compute" />
import { graphqlHandler } from "graphql-edge";
import schema from "../schema.graphql";

addEventListener("fetch", (event: FetchEvent) => event.respondWith(handleRequest(event)));

const resolvers = {
  Query: {
    async books() {
      return [
        { id: 1, title: "book01" },
        { id: 2, title: "book02" },
      ];
    }
  }
};

const handler = graphqlHandler({
  typeDefs: schema,
  resolvers,
});

async function handleRequest(event: FetchEvent) {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname === "/graphql") {
    return handler(request);
  }
  return new Response("OK", { status: 200 });
}
