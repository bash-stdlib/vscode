import * as assert from "assert";
import { generateMockFunctions } from "@/providers/completion/mocks";
import { ShdocFunction } from "@/shell/shdoc";

suite("generateMockFunctions Logic Test Suite", () => {
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

  test("it should replace 'object' with mock name in function names", () => {
    const mockName = "myMock";
    const generated = generateMockFunctions(templates, mockName);

    assert.strictEqual(generated[0].name, "myMock");
    assert.strictEqual(generated[1].name, "clear");
  });

  test("it should replace 'object' with mock name in namespaces", () => {
    const mockName = "myMock";
    const generated = generateMockFunctions(templates, mockName);

    assert.strictEqual(generated[0].namespace, "");
    assert.strictEqual(generated[1].namespace, "myMock.mock");
  });

  test("it should replace 'object' in descriptions", () => {
    const mockName = "myMock";
    const generated = generateMockFunctions(templates, mockName);

    assert.strictEqual(generated[0].description, "A mock for myMock.");
    assert.strictEqual(generated[1].description, "Clears myMock mock.");
  });

  test("it should replace 'object' in arguments, globals and keywords", () => {
    const mockName = "myMock";
    const generated = generateMockFunctions(templates, mockName);

    assert.strictEqual(generated[0].args[0].desc, "Arg for myMock");
    assert.strictEqual(generated[0].globals[0].name, "_myMock_mock_rc");
    assert.strictEqual(generated[0].globals[0].desc, "RC for myMock");
    assert.strictEqual(generated[0].keywords[0].desc, "Keyword for myMock");
  });
});
