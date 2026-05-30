import * as assert from "assert";
import { extractFullIdentifier, findFunction } from "@/shell/hoverProvider";
import { ShdocFunction } from "@/shell/shdoc";

suite("Hover Provider Test Suite", () => {
  suite("extractFullIdentifier", () => {
    test("should extract simple function name", () => {
      const result = extractFullIdentifier("is_empty", 8);
      assert.strictEqual(result, "is_empty");
    });

    test("should extract namespaced function name", () => {
      const result = extractFullIdentifier("stdlib.array.is_empty", 21);
      assert.strictEqual(result, "stdlib.array.is_empty");
    });

    test("should extract identifier from middle of line", () => {
      const result = extractFullIdentifier(
        "result=$(stdlib.array.is_empty arr)",
        15,
      );
      assert.strictEqual(result, "stdlib.array.is_empty");
    });

    test("should extract identifier at end of line", () => {
      const result = extractFullIdentifier(
        "if stdlib.array.is_empty arr; then",
        23,
      );
      assert.strictEqual(result, "stdlib.array.is_empty");
    });

    test("should extract identifier at start of line", () => {
      const result = extractFullIdentifier("stdlib.array.is_empty", 0);
      assert.strictEqual(result, "stdlib.array.is_empty");
    });

    test("should stop at non-word characters", () => {
      const result = extractFullIdentifier("stdlib.array.is_empty(", 18);
      assert.strictEqual(result, "stdlib.array.is_empty");
    });

    test("should handle multiple depth namespaces", () => {
      const result = extractFullIdentifier("_testing.mock.assert.equals", 27);
      assert.strictEqual(result, "_testing.mock.assert.equals");
    });

    test("should handle position in middle of identifier", () => {
      const result = extractFullIdentifier("stdlib.array.is_empty", 10);
      assert.strictEqual(result, "stdlib.array.is_empty");
    });
  });

  suite("findFunction", () => {
    const mockFunctions: ShdocFunction[] = [
      {
        name: "is_empty",
        namespace: "stdlib.array",
        description: "Check if array is empty",
        args: [],
        isTesting: false,
        options: [],
        exitcodes: [],
      },
      {
        name: "join",
        namespace: "stdlib.string",
        description: "Join array elements",
        args: [
          { name: "sep", type: "string", desc: "Separator" },
          { name: "arr", type: "array", desc: "Array" },
        ],
        isTesting: false,
        options: [],
        exitcodes: [],
      },
      {
        name: "root_func",
        description: "A root level function",
        args: [],
        isTesting: false,
        options: [],
        exitcodes: [],
      },
      {
        name: "assert",
        namespace: "_testing.assert",
        description: "Assert condition",
        args: [
          { name: "condition", type: "bool", desc: "Condition to assert" },
        ],
        isTesting: true,
        options: [],
        exitcodes: [{ code: "0", desc: "Success" }],
      },
    ];

    test("should find function by full qualified name", () => {
      const result = findFunction(mockFunctions, "stdlib.array.is_empty");
      assert.ok(result);
      assert.strictEqual(result?.name, "is_empty");
      assert.strictEqual(result?.namespace, "stdlib.array");
    });

    test("should find function by partial name", () => {
      const result = findFunction(mockFunctions, "is_empty");
      assert.ok(result);
      assert.strictEqual(result?.name, "is_empty");
    });

    test("should find root level function by name", () => {
      const result = findFunction(mockFunctions, "root_func");
      assert.ok(result);
      assert.strictEqual(result?.name, "root_func");
      assert.strictEqual(result?.namespace, undefined);
    });

    test("should find deeply namespaced function", () => {
      const result = findFunction(mockFunctions, "_testing.assert.assert");
      assert.ok(result);
      assert.strictEqual(result?.name, "assert");
      assert.strictEqual(result?.namespace, "_testing.assert");
    });

    test("should return null for non-existent function", () => {
      const result = findFunction(mockFunctions, "nonexistent");
      assert.strictEqual(result, null);
    });

    test("should return null for partial non-existent namespace", () => {
      const result = findFunction(mockFunctions, "stdlib.string.missing");
      assert.strictEqual(result, null);
    });

    test("should prioritize full qualified name match over partial", () => {
      const result = findFunction(mockFunctions, "join");
      assert.ok(result);
      assert.strictEqual(result?.name, "join");
    });

    test("should handle empty function list", () => {
      const result = findFunction([], "stdlib.array.is_empty");
      assert.strictEqual(result, null);
    });

    test("should find function with underscores in namespace", () => {
      const result = findFunction(mockFunctions, "_testing.assert.assert");
      assert.ok(result);
      assert.strictEqual(result?.namespace, "_testing.assert");
    });
  });
});
