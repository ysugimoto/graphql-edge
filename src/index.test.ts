import { graphqlHandler } from "./index";
import { GraphQLError } from "graphql";

const resolvers = {
  Query: {
    async books() {
      return [
        { id: 1, title: "book01" },
        { id: 2, title: "book02" },
      ];
    },
  },
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
const query = `
query GetBooks {
  books {
    id
    title
  }
}
`;

describe("graphqlHandler test", () => {
  it("throws error in invalid schema", () => {
    expect(() => {
      graphqlHandler({ typeDefs: "foo", resolvers });
    }).toThrowError(GraphQLError);
  });

  it("Schema validation error", () => {
    expect(() => {
      graphqlHandler({
        typeDefs: `
type Book {
  id: !Int
  title: String!
}

type Query {
  books: [Book]!
}
`,
        resolvers,
      });
    }).toThrowError(GraphQLError);
  });

  it("create event handler successfully", () => {
    expect(
      graphqlHandler({
        typeDefs: schema,
        resolvers,
      })
    ).toEqual(expect.any(Function));
  });
});
