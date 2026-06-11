import * as assert from "assert";
import { extractFullIdentifier, findFunction } from "@/providers/hoverProvider";
import { ShdocFunction } from "@/shell/shdoc";

suite("Hover Provider Test Suite", () => {
  suite("extractFullIdentifier", () => {
    suite("when identifier is simple", () => {
      let result: string | null;

      setup(() => {
        result = extractFullIdentifier("is_empty", 8);
      });

      test("should extract simple function name", () => {
        assert.strictEqual(result, "is_empty");
      });
    });

    suite("when identifier is namespaced", () => {
      let result: string | null;

      setup(() => {
        result = extractFullIdentifier("stdlib.array.is_empty", 21);
      });

      test("should extract namespaced function name", () => {
        assert.strictEqual(result, "stdlib.array.is_empty");
      });
    });

    suite("when identifier is in middle of line", () => {
      let result: string | null;

      setup(() => {
        result = extractFullIdentifier("result=$(stdlib.array.is_empty arr)", 15);
      });

      test("should extract identifier", () => {
        assert.strictEqual(result, "stdlib.array.is_empty");
      });
    });

    suite("when identifier is at end of line", () => {
      let result: string | null;

      setup(() => {
        result = extractFullIdentifier("if stdlib.array.is_empty arr; then", 23);
      });

      test("should extract identifier", () => {
        assert.strictEqual(result, "stdlib.array.is_empty");
      });
    });

    suite("when position is at start of line", () => {
      let result: string | null;

      setup(() => {
        result = extractFullIdentifier("stdlib.array.is_empty", 0);
      });

      test("should extract identifier", () => {
        assert.strictEqual(result, "stdlib.array.is_empty");
      });
    });

    suite("when identifier is followed by non-word character", () => {
      let result: string | null;

      setup(() => {
        result = extractFullIdentifier("stdlib.array.is_empty(", 18);
      });

      test("should stop at non-word characters", () => {
        assert.strictEqual(result, "stdlib.array.is_empty");
      });
    });

    suite("when identifier has multiple depth namespaces", () => {
      let result: string | null;

      setup(() => {
        result = extractFullIdentifier("_testing.mock.assert.equals", 27);
      });

      test("should handle multiple depth namespaces", () => {
        assert.strictEqual(result, "_testing.mock.assert.equals");
      });
    });

    suite("when position is in middle of identifier", () => {
      let result: string | null;

      setup(() => {
        result = extractFullIdentifier("stdlib.array.is_empty", 10);
      });

      test("should handle position in middle of identifier", () => {
        assert.strictEqual(result, "stdlib.array.is_empty");
      });
    });
  });

  suite("findFunction", () => {
    const mockFunctions: ShdocFunction[] = [
      {
        name: "is_empty",
        namespace: "stdlib.array",
        description: "Check if array is empty",
        args: [],
        globals: [],
        isTesting: false,
        keywords: [],
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
        globals: [],
        isTesting: false,
        keywords: [],
        options: [],
        exitcodes: [],
      },
      {
        name: "root_func",
        description: "A root level function",
        args: [],
        globals: [],
        isTesting: false,
        keywords: [],
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
        globals: [],
        isTesting: true,
        keywords: [],
        options: [],
        exitcodes: [{ code: "0", desc: "Success" }],
      },
    ];

    suite("when finding by full qualified name", () => {
      let result: ShdocFunction | null;

      setup(() => {
        result = findFunction(mockFunctions, "stdlib.array.is_empty");
      });

      test("should find function", () => {
        assert.ok(result);
      });

      test("should have correct name", () => {
        assert.strictEqual(result?.name, "is_empty");
      });

      test("should have correct namespace", () => {
        assert.strictEqual(result?.namespace, "stdlib.array");
      });
    });

    suite("when finding by partial name", () => {
      let result: ShdocFunction | null;

      setup(() => {
        result = findFunction(mockFunctions, "is_empty");
      });

      test("should find function", () => {
        assert.ok(result);
      });

      test("should have correct name", () => {
        assert.strictEqual(result?.name, "is_empty");
      });
    });

    suite("when finding root level function", () => {
      let result: ShdocFunction | null;

      setup(() => {
        result = findFunction(mockFunctions, "root_func");
      });

      test("should find function", () => {
        assert.ok(result);
      });

      test("should have correct name", () => {
        assert.strictEqual(result?.name, "root_func");
      });

      test("should have no namespace", () => {
        assert.strictEqual(result?.namespace, undefined);
      });
    });

    suite("when finding deeply namespaced function", () => {
      let result: ShdocFunction | null;

      setup(() => {
        result = findFunction(mockFunctions, "_testing.assert.assert");
      });

      test("should find function", () => {
        assert.ok(result);
      });

      test("should have correct name", () => {
        assert.strictEqual(result?.name, "assert");
      });

      test("should have correct namespace", () => {
        assert.strictEqual(result?.namespace, "_testing.assert");
      });
    });

    suite("when function does not exist", () => {
      let result: ShdocFunction | null;

      setup(() => {
        result = findFunction(mockFunctions, "nonexistent");
      });

      test("should return null", () => {
        assert.strictEqual(result, null);
      });
    });

    suite("when partial non-existent namespace", () => {
      let result: ShdocFunction | null;

      setup(() => {
        result = findFunction(mockFunctions, "stdlib.string.missing");
      });

      test("should return null", () => {
        assert.strictEqual(result, null);
      });
    });

    suite("when multiple matches exist", () => {
      let result: ShdocFunction | null;

      setup(() => {
        result = findFunction(mockFunctions, "join");
      });

      test("should prioritize full qualified name match over partial", () => {
        assert.ok(result);
        assert.strictEqual(result?.name, "join");
      });
    });

    suite("when function list is empty", () => {
      let result: ShdocFunction | null;

      setup(() => {
        result = findFunction([], "stdlib.array.is_empty");
      });

      test("should return null", () => {
        assert.strictEqual(result, null);
      });
    });

    suite("when namespace contains underscores", () => {
      let result: ShdocFunction | null;

      setup(() => {
        result = findFunction(mockFunctions, "_testing.assert.assert");
      });

      test("should find function", () => {
        assert.ok(result);
        assert.strictEqual(result?.namespace, "_testing.assert");
      });
    });
  });
});
