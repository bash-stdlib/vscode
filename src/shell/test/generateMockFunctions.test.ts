import * as assert from "assert";
import { generateMockFunctions } from "@/providers/completion/mocks";
import { ShdocFunction } from "@/shell/shdoc";

suite("generateMockFunctions", () => {
  const templates: ShdocFunction[] = [
    {
      name: "object",
      namespace: "",
      description: "A mock for object.",
      args: [{ name: "arg1", type: "string", desc: "Arg for object" }],
      globals: [
        { name: "_object_mock_rc", type: "integer", desc: "RC for object" },
      ],
      keywords: [
        { name: "MOCK_KEYWORD", type: "string", desc: "Keyword for object" },
      ],
      options: [],
      exitcodes: [],
      isTesting: true,
    },
    {
      name: "clear",
      namespace: "object.mock",
      description: "Clears object mock.",
      args: [],
      globals: [],
      keywords: [],
      options: [],
      exitcodes: [],
      isTesting: true,
    },
  ];

  suite("when generating mock functions", () => {
    let generated: ShdocFunction[];
    const mockName = "myMock";

    setup(() => {
      generated = generateMockFunctions(templates, mockName);
    });

    test("it should replace 'object' with mock name in first function name", () => {
      assert.strictEqual(generated[0].name, "myMock");
    });

    test("it should keep name of other functions", () => {
      assert.strictEqual(generated[1].name, "clear");
    });

    test("it should leave empty namespace as is", () => {
      assert.strictEqual(generated[0].namespace, "");
    });

    test("it should replace 'object' with mock name in non-empty namespaces", () => {
      assert.strictEqual(generated[1].namespace, "myMock.mock");
    });

    test("it should replace 'object' in function descriptions", () => {
      assert.strictEqual(generated[0].description, "A mock for myMock.");
    });

    test("it should replace 'object' in other function descriptions", () => {
      assert.strictEqual(generated[1].description, "Clears myMock mock.");
    });

    test("it should replace 'object' in arguments description", () => {
      assert.strictEqual(generated[0].args[0].desc, "Arg for myMock");
    });

    test("it should replace 'object' in global variable name", () => {
      assert.strictEqual(generated[0].globals[0].name, "_myMock_mock_rc");
    });

    test("it should replace 'object' in global variable description", () => {
      assert.strictEqual(generated[0].globals[0].desc, "RC for myMock");
    });

    test("it should replace 'object' in keyword description", () => {
      assert.strictEqual(generated[0].keywords[0].desc, "Keyword for myMock");
    });
  });
});
