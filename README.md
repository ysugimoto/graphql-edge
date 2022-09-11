# graphql-edge

Execute GraphQL on the edge.

## Installation

Install this library as dependency via your favorite package manager :)

```shell
$ [npm|yarn|pnpm] install graphql-edge
```

## Usage

Following example works on [Fastly Compute@Edge](https://developer.fastly.com/learning/compute/javascript/).

A GraphQL schema defines at *schema.graphql*:

```graphql
type Book {
  id: Int!
  title: String!
}

type Query {
  books: [Book]!
}
```

And then server implementation is:

```ts
import { graphqlHandler } from "graphql-edge";
import schema from "../../_misc/schema.graphql";

addEventListener("fetch", (event: FetchEvent) => event.respondWith(handleRequest(event)));

// If you want to declare types with TypeScript, prefer to use graphql-codegen
const resolvers = {
  Query: {
    async books() {
      // Actually, we can send resolve request to Fastly Backend!
      return [
        { id: 1, title: "book01" },
        { id: 2, title: "book02" },
      ];
    }
  }
};

async function handleRequest(event: FetchEvent) {
  const { request } = event;
  const url = new URL(request.url);

  // Only handles /graphql pathname
  if (url.pathname === "/graphql") {
    const handler = graphqlHandler({
      typeDefs: schema,
      resolvers,
    });
    return handler(request);
  }
  return new Response("Not Found", { status: 404 });
}
```

Finally, the GraphQL query is:

```graphql
query GetBooks {
  books {
    id
    title
  }
}
```

And run server and make request, then got response:

```shell
$ fastly compute serve
$ curl -v http://localhost:7676/graphql -H "Content-Type: application/graphql" -d @request.graphql
# => {"data":{"books":[{"id":1,"title":"book01"},{"id":2,"title":"book02"}]}}
```

See examples in detail:

- [Fastly Compute@Edge](https://github.com/ysugimoto/graphql-edge/tree/main/example/fastly)
- [Cloudflare Workers](https://github.com/ysugimoto/graphql-edge/tree/main/example/cloudflare)

## Features

- [x] TypeScript Support
- [x] Works on Fastly Compute@Edge
- [x] Works on Cloudflare Workers

## Author

Yoshiaki Sugimoto <sugimoto@wnotes.net>

## License

MIT
