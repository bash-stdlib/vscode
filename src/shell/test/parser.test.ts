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
      // Arrange
      const html = loadAsset("single_function.html");

      // Act
      functions = parser.parse(html);
      firstFunction = functions[0];
    });

    test("it should extract one function", () => {
      // Assert
      assert.strictEqual(functions.length, 1);
    });

    test("it should correctly extract the function name", () => {
      // Assert
      assert.strictEqual(firstFunction.name, "stdlib.array.assert.is_array");
    });

    test("it should correctly extract the function description", () => {
      // Assert
      assert.strictEqual(firstFunction.description, "Asserts that a variable is an array.");
    });

    test("it should extract one argument", () => {
      // Assert
      assert.strictEqual(firstFunction.args.length, 1);
    });

    test("it should correctly extract the first argument's name", () => {
      // Assert
      assert.strictEqual(firstFunction.args[0].name, "$1");
    });

    test("it should correctly extract the first argument's type", () => {
      // Assert
      assert.strictEqual(firstFunction.args[0].type, "string");
    });

    test("it should correctly extract the first argument's description", () => {
      // Assert
      assert.strictEqual(firstFunction.args[0].desc, "The name of the variable to check.");
    });

    test("it should extract three exit codes", () => {
      // Assert
      assert.strictEqual(firstFunction.exitcodes.length, 3);
    });

    test("it should correctly extract the first exit code's code", () => {
      // Assert
      assert.strictEqual(firstFunction.exitcodes[0].code, "0");
    });

    test("it should correctly extract the first exit code's description", () => {
      // Assert
      assert.strictEqual(firstFunction.exitcodes[0].desc, "If the assertion succeeded.");
    });
  });

  suite("when parsing multiple functions", () => {
    let functions: ShdocFunction[];

    setup(() => {
      // Arrange
      const html = loadAsset("multiple_functions.html");

      // Act
      functions = parser.parse(html);
    });

    test("it should extract two functions", () => {
      // Assert
      assert.strictEqual(functions.length, 2);
    });

    test("it should correctly extract the first function name", () => {
      // Assert
      assert.strictEqual(functions[0].name, "stdlib.array.assert.is_array");
    });

    test("it should correctly extract the second function name", () => {
      // Assert
      assert.strictEqual(functions[1].name, "stdlib.array.assert.is_contains");
    });
  });

  suite("when parsing functions with auto-generated IDs", () => {
    let functions: ShdocFunction[];
    let firstFunction: ShdocFunction;

    setup(() => {
      // Arrange
      const html = loadAsset("auto_id_function.html");

      // Act
      functions = parser.parse(html);
      firstFunction = functions[0];
    });

    test("it should extract one function", () => {
      // Assert
      assert.strictEqual(functions.length, 1);
    });

    test("it should correctly extract all arguments even with auto-generated IDs", () => {
      // Assert
      assert.strictEqual(firstFunction.args.length, 2);
    });

    test("it should correctly extract the second argument's name", () => {
      // Assert
      assert.strictEqual(firstFunction.args[1].name, "$2");
    });

    test("it should correctly extract exit codes even with auto-generated IDs", () => {
      // Assert
      assert.strictEqual(firstFunction.exitcodes.length, 1);
    });

    test("it should correctly extract the success exit code", () => {
      // Assert
      assert.strictEqual(firstFunction.exitcodes[0].code, "0");
    });
  });
});
