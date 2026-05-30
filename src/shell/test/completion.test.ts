import * as assert from "assert";
import {
  extractNamespacePrefixFromLineText,
  getNextNamespaceLevels,
  getFunctionsInNamespace,
} from "@/shell/completion";
import { ShdocFunction } from "@/shell/shdoc";

suite("Completion Logic Test Suite", () => {
  suite("extractNamespacePrefixFromLineText", () => {
    suite("when line text ends with a dotted namespace", () => {
      let result: { namespace: string; endsWithDot: boolean };

      setup(() => {
        result = extractNamespacePrefixFromLineText("stdlib.string.");
      });

      test("it should identify the namespace", () => {
        assert.strictEqual(result.namespace, "stdlib.string");
      });

      test("it should indicate it ends with a dot", () => {
        assert.strictEqual(result.endsWithDot, true);
      });
    });

    suite("when line text ends with a namespace without dot", () => {
      let result: { namespace: string; endsWithDot: boolean };

      setup(() => {
        result = extractNamespacePrefixFromLineText("stdlib.str");
      });

      test("it should identify the partial namespace", () => {
        assert.strictEqual(result.namespace, "stdlib.str");
      });

      test("it should indicate it does not end with a dot", () => {
        assert.strictEqual(result.endsWithDot, false);
      });
    });

    suite("when line text does not contain a namespace", () => {
      let result: { namespace: string; endsWithDot: boolean };

      setup(() => {
        result = extractNamespacePrefixFromLineText("echo ");
      });

      test("it should return an empty namespace", () => {
        assert.strictEqual(result.namespace, "");
      });

      test("it should indicate it does not end with a dot", () => {
        assert.strictEqual(result.endsWithDot, false);
      });
    });

    suite("when line text ends with @ symbol", () => {
      let result: { namespace: string; endsWithDot: boolean };

      setup(() => {
        result = extractNamespacePrefixFromLineText("@para");
      });

      test("it should identify the namespace including @", () => {
        assert.strictEqual(result.namespace, "@para");
      });
    });
  });

  suite("getNextNamespaceLevels", () => {
    suite("when there are sub-namespaces", () => {
      let nextLevels: { [key: string]: string };
      const functions: ShdocFunction[] = [
        {
          name: "fn1",
          namespace: "stdlib.string.format",
          args: [],
          description: "",
          exitcodes: [],
          options: [],
        },
        {
          name: "fn2",
          namespace: "stdlib.string.parse",
          args: [],
          description: "",
          exitcodes: [],
          options: [],
        },
        {
          name: "fn3",
          namespace: "stdlib.math",
          args: [],
          description: "",
          exitcodes: [],
          options: [],
        },
      ];

      setup(() => {
        nextLevels = getNextNamespaceLevels(functions, "stdlib.string");
      });

      test("it should return the next unique levels", () => {
        assert.strictEqual(Object.keys(nextLevels).length, 2);
        assert.ok("format" in nextLevels);
        assert.ok("parse" in nextLevels);
      });

      test("it should return correct fully qualified names", () => {
        assert.strictEqual(nextLevels["format"], "stdlib.string.format");
        assert.strictEqual(nextLevels["parse"], "stdlib.string.parse");
      });
    });

    suite("when filtering root namespaces", () => {
      const functions: ShdocFunction[] = [
        {
          name: "error",
          namespace: "_testing",
          args: [],
          description: "",
          exitcodes: [],
          options: [],
        },
        {
          name: "mock",
          namespace: "_mock",
          args: [],
          description: "",
          exitcodes: [],
          options: [],
        },
        {
          name: "fn1",
          namespace: "stdlib.string",
          args: [],
          description: "",
          exitcodes: [],
          options: [],
        },
      ];

      suite("filtering by '_te' prefix", () => {
        let filtered: { [key: string]: string };

        setup(() => {
          filtered = getNextNamespaceLevels(functions, "", "_te");
        });

        test("it should return one matching namespace", () => {
          assert.strictEqual(Object.keys(filtered).length, 1);
        });

        test("it should include _testing", () => {
          assert.ok("_testing" in filtered);
        });

        test("it should have correct value", () => {
          assert.strictEqual(filtered["_testing"], "_testing");
        });
      });

      suite("filtering by '_xyz' prefix (no matches)", () => {
        let filtered: { [key: string]: string };

        setup(() => {
          filtered = getNextNamespaceLevels(functions, "", "_xyz");
        });

        test("it should return no matches", () => {
          assert.strictEqual(Object.keys(filtered).length, 0);
        });
      });

      suite("filtering by '_' prefix", () => {
        let filtered: { [key: string]: string };

        setup(() => {
          filtered = getNextNamespaceLevels(functions, "", "_");
        });

        test("it should return two matching namespaces", () => {
          assert.strictEqual(Object.keys(filtered).length, 2);
        });

        test("it should include _testing", () => {
          assert.ok("_testing" in filtered);
        });

        test("it should include _mock", () => {
          assert.ok("_mock" in filtered);
        });
      });

      suite("filtering by 'std' prefix", () => {
        let filtered: { [key: string]: string };

        setup(() => {
          filtered = getNextNamespaceLevels(functions, "", "std");
        });

        test("it should return one matching namespace", () => {
          assert.strictEqual(Object.keys(filtered).length, 1);
        });

        test("it should include stdlib", () => {
          assert.ok("stdlib" in filtered);
        });
      });
    });
  });

  suite("getFunctionsInNamespace", () => {
    suite("when functions exist in the namespace", () => {
      let result: ShdocFunction[];
      const functions: ShdocFunction[] = [
        {
          name: "join",
          namespace: "stdlib.string",
          args: [],
          description: "",
          exitcodes: [],
          options: [],
        },
        {
          name: "split",
          namespace: "stdlib.string",
          args: [],
          description: "",
          exitcodes: [],
          options: [],
        },
        {
          name: "other",
          namespace: "stdlib.math",
          args: [],
          description: "",
          exitcodes: [],
          options: [],
        },
      ];

      setup(() => {
        result = getFunctionsInNamespace(functions, "stdlib.string");
      });

      test("it should return only functions in that namespace", () => {
        assert.strictEqual(result.length, 2);
        assert.strictEqual(result[0].name, "join");
        assert.strictEqual(result[1].name, "split");
      });
    });
  });
});
