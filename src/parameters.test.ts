import { parseGraphQLParameters } from "./parameters";

describe("GET parseGraphQLParameters", () => {

  it("pass for valid request", async () => {
    const sp = new URLSearchParams();
    sp.set("query", "query");
    sp.set("variables", JSON.stringify({ foo: "bar" }));

    const req = <Request>{
      url: `http://localhost/graphql?${sp.toString()}`,
      method: "GET",
      headers: {},
    };

    const params = await parseGraphQLParameters(req);
    expect(params).toMatchObject({
      query: "query",
      variables: { foo: "bar" },
      operationName: null,
      raw: false,
    });
  });

  it("error on invalid variables JSON", async () => {
    const sp = new URLSearchParams();
    sp.set("query", "query");
    sp.set("variables", "{Invalid Variables}");

    const req = <Request>{
      url: `http://localhost/graphql?${sp.toString()}`,
      method: "GET",
      headers: {},
    };

    expect(parseGraphQLParameters(req)).rejects.toBeInstanceOf(Error);
  });
});

describe("POST parseGraphQLParameters", () => {

  it("pass for application/graphql", async () => {
    const req = <Request>{
      url: `http://localhost/graphql`,
      method: "POST",
      headers: <Headers>{
        get: (name: string) => "application/graphql"
      },
      text: async () => "foo",
    };

    const params = await parseGraphQLParameters(req);
    expect(params).toMatchObject({
      query: "foo",
      variables: null,
      operationName: null,
      raw: false,
    });
  });

  it("pass for application/json", async () => {
    const req = <Request>{
      url: `http://localhost/graphql`,
      method: "POST",
      headers: <Headers>{
        get: (name: string) => "application/json"
      },
      text: async () => JSON.stringify({
        query: "query",
        variables: { foo: "bar" },
        operationName: "op",
      }),
    };

    const params = await parseGraphQLParameters(req);
    expect(params).toMatchObject({
      query: "query",
      variables: { foo: "bar" },
      operationName: "op",
      raw: false,
    });
  });

  it("invalid JSON for application/json", async () => {
    const req = <Request>{
      url: `http://localhost/graphql`,
      method: "POST",
      headers: <Headers>{
        get: (name: string) => "application/json"
      },
      text: async () => "InvalidJSON"
    };

    expect(parseGraphQLParameters(req)).rejects.toBeInstanceOf(Error);
  });

  it("pass for application/x-www-form-urlencoded", async () => {
    const sp = new URLSearchParams();
    sp.set("query", "query");
    sp.set("variables", JSON.stringify({ foo: "bar" }));
    sp.set("operationName", "op");

    const req = <Request>{
      url: `http://localhost/graphql`,
      method: "POST",
      headers: <Headers>{
        get: (name: string) => "application/x-www-form-urlencoded"
      },
      text: async () => sp.toString(),
    };

    const params = await parseGraphQLParameters(req);
    expect(params).toMatchObject({
      query: "query",
      variables: { foo: "bar" },
      operationName: "op",
      raw: false,
    });
  });

  it("empty for other content type", async () => {
    const req = <Request>{
      url: `http://localhost/graphql`,
      method: "POST",
      headers: <Headers>{
        get: (name: string) => "application/unknown"
      },
      text: async () => Promise.resolve("foo"),
    };

    const params = await parseGraphQLParameters(req);
    expect(params).toMatchObject({
      query: null,
      variables: null,
      operationName: null,
      raw: false,
    });
  });

});
