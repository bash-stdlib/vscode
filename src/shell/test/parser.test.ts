import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { HtmlDocumentationParser } from "@/shell/htmlParser";
import { ShdocFunction } from "@/shell/shdoc";

suite("HTML Parser Test Suite", () => {
  const parser = new HtmlDocumentationParser();

  const loadAsset = (filename: string): string => {
    const filePath = path.join(__dirname, "assets", filename);
    return fs.readFileSync(filePath, "utf8");
  };

  suite("when parsing a single function", () => {
    let functions: ShdocFunction[];
    let firstFunction: ShdocFunction;

    setup(() => {
      const html = loadAsset("single_function.html");

      functions = parser.parse(html);
      firstFunction = functions[0];
    });

    test("it should extract one function", () => {
      assert.strictEqual(functions.length, 1);
    });

    test("it should correctly extract the function name", () => {
      assert.strictEqual(firstFunction.name, "is_array");
    });

    test("it should correctly extract the namespace", () => {
      assert.strictEqual(firstFunction.namespace, "stdlib.array.assert");
    });

    test("it should correctly extract the function description", () => {
      assert.strictEqual(
        firstFunction.description,
        "Asserts that a variable is an array.",
      );
    });

    test("it should extract one argument", () => {
      assert.strictEqual(firstFunction.args.length, 1);
    });

    test("it should correctly extract the first argument's name", () => {
      assert.strictEqual(firstFunction.args[0].name, "$1");
    });

    test("it should correctly extract the first argument's type", () => {
      assert.strictEqual(firstFunction.args[0].type, "string");
    });

    test("it should correctly extract the first argument's description", () => {
      assert.strictEqual(
        firstFunction.args[0].desc,
        "The name of the variable to check.",
      );
    });

    test("it should extract three exit codes", () => {
      assert.strictEqual(firstFunction.exitcodes.length, 3);
    });

    test("it should correctly extract the first exit code's code", () => {
      assert.strictEqual(firstFunction.exitcodes[0].code, "0");
    });

    test("it should correctly extract the first exit code's description", () => {
      assert.strictEqual(
        firstFunction.exitcodes[0].desc,
        "If the assertion succeeded.",
      );
    });
  });

  suite("when parsing multiple functions", () => {
    let functions: ShdocFunction[];

    setup(() => {
      const html = loadAsset("multiple_functions.html");

      functions = parser.parse(html);
    });

    test("it should extract two functions", () => {
      assert.strictEqual(functions.length, 2);
    });

    test("it should correctly extract the first function name", () => {
      assert.strictEqual(functions[0].name, "is_array");
    });

    test("it should correctly extract the first function namespace", () => {
      assert.strictEqual(functions[0].namespace, "stdlib.array.assert");
    });

    test("it should correctly extract the second function name", () => {
      assert.strictEqual(functions[1].name, "is_contains");
    });

    test("it should correctly extract the second function namespace", () => {
      assert.strictEqual(functions[1].namespace, "stdlib.array.assert");
    });
  });

  suite("when parsing functions with auto-generated IDs", () => {
    let functions: ShdocFunction[];
    let firstFunction: ShdocFunction;

    setup(() => {
      const html = loadAsset("auto_id_function.html");

      functions = parser.parse(html);
      firstFunction = functions[0];
    });

    test("it should extract one function", () => {
      assert.strictEqual(functions.length, 1);
    });

    test("it should correctly extract all arguments even with auto-generated IDs", () => {
      assert.strictEqual(firstFunction.args.length, 2);
    });

    test("it should correctly extract the second argument's name", () => {
      assert.strictEqual(firstFunction.args[1].name, "$2");
    });

    test("it should correctly extract exit codes even with auto-generated IDs", () => {
      assert.strictEqual(firstFunction.exitcodes.length, 1);
    });

    test("it should correctly extract the success exit code", () => {
      assert.strictEqual(firstFunction.exitcodes[0].code, "0");
    });
  });

  suite("when parsing testing library functions", () => {
    let functions: ShdocFunction[];

    setup(() => {
      const html = loadAsset("testing_functions.html");
      functions = parser.parse(html);
    });

    test("it should extract three functions", () => {
      assert.strictEqual(functions.length, 3);
    });

    test("it should correctly extract assert_is_array and assign it to the root namespace", () => {
      const fn = functions.find((f) => f.name === "assert_is_array");
      assert.ok(fn);
      assert.strictEqual(fn.namespace, "");
    });

    test("it should correctly extract _testing.error and assign it to _testing namespace", () => {
      const fn = functions.find((f) => f.name === "error");
      assert.ok(fn);
      assert.strictEqual(fn.namespace, "_testing");
    });

    test("it should correctly extract @parametrize and assign it to no namespace if it has no dot", () => {
      const fn = functions.find((f) => f.name === "@parametrize");
      assert.ok(fn);
      assert.strictEqual(fn.namespace, "");
    });
  });
});
