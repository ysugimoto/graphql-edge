import { graphqlHandler } from "graphql-edge";
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
}

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

const schema = `
type Book {
  id: Int!
  title: String!
}

type Query {
  books: [Book]!
}
`;

const handler = graphqlHandler({
  typeDefs: schema,
  resolvers,
});

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
    const url = new URL(request.url);
    console.log(request.headers.get("content-type"));

    if (url.pathname === "/graphql") {
      return handler(request);
    }
		return new Response("Hello World!");
	},
};
