import * as assert from "assert";
import {
  extractNamespacePrefixFromLineText,
  getNextNamespaceLevels,
  getFunctionsInNamespace,
} from "@/providers/completion/namespaces";
import { ShdocFunction } from "@/shell/shdoc";

suite("Namespace Test Suite", () => {
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
          isTesting: false,
          globals: [],
          keywords: [],
          options: [],
        },
        {
          name: "fn2",
          namespace: "stdlib.string.parse",
          args: [],
          description: "",
          exitcodes: [],
          isTesting: false,
          globals: [],
          keywords: [],
          options: [],
        },
        {
          name: "fn3",
          namespace: "stdlib.math",
          args: [],
          description: "",
          exitcodes: [],
          isTesting: false,
          globals: [],
          keywords: [],
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
          isTesting: true,
          globals: [],
          keywords: [],
          options: [],
        },
        {
          name: "mock",
          namespace: "_mock",
          args: [],
          description: "",
          exitcodes: [],
          isTesting: true,
          globals: [],
          keywords: [],
          options: [],
        },
        {
          name: "fn1",
          namespace: "stdlib.string",
          args: [],
          description: "",
          exitcodes: [],
          isTesting: false,
          globals: [],
          keywords: [],
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

      suite("when there are extra namespaces", () => {
        let nextLevels: { [key: string]: string };
        const functions: ShdocFunction[] = [
          {
            name: "fn1",
            namespace: "stdlib.string",
            args: [],
            description: "",
            exitcodes: [],
            isTesting: false,
            globals: [],
            keywords: [],
            options: [],
          },
        ];

        suite("at the root level", () => {
          setup(() => {
            nextLevels = getNextNamespaceLevels(functions, "", undefined, [
              "custom",
            ]);
          });

          test("it should include the extra namespace", () => {
            assert.ok("custom" in nextLevels);
            assert.strictEqual(nextLevels["custom"], "custom");
          });

          test("it should still include standard namespaces", () => {
            assert.ok("stdlib" in nextLevels);
          });
        });

        suite("at a nested level", () => {
          setup(() => {
            nextLevels = getNextNamespaceLevels(
              functions,
              "custom",
              undefined,
              ["custom.sub"],
            );
          });

          test("it should include the nested extra namespace", () => {
            assert.ok("sub" in nextLevels);
            assert.strictEqual(nextLevels["sub"], "custom.sub");
          });
        });

        suite("with filtering", () => {
          setup(() => {
            nextLevels = getNextNamespaceLevels(functions, "", "cus", [
              "custom",
              "other",
            ]);
          });

          test("it should return only the matching extra namespace", () => {
            assert.strictEqual(Object.keys(nextLevels).length, 1);
            assert.ok("custom" in nextLevels);
          });
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
          isTesting: false,
          globals: [],
          keywords: [],
          options: [],
        },
        {
          name: "split",
          namespace: "stdlib.string",
          args: [],
          description: "",
          exitcodes: [],
          isTesting: false,
          globals: [],
          keywords: [],
          options: [],
        },
        {
          name: "other",
          namespace: "stdlib.math",
          args: [],
          description: "",
          exitcodes: [],
          isTesting: false,
          globals: [],
          keywords: [],
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
