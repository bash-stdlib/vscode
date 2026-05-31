import * as assert from "assert";
import { createMarkdownDocumentation } from "@/shell/markdown";
import { ShdocFunction } from "@/shell/shdoc";

suite("Markdown Documentation Test Suite", () => {
  suite("when generating documentation for a complete function", () => {
    let markdown: string;

    setup(() => {
      const parsedFunction: ShdocFunction = {
        name: "test_func",
        description: "A test function.",
        args: [{ name: "arg1", type: "string", desc: "First argument" }],
        options: [{ flags: "-f", desc: "Force" }],
        exitcodes: [{ code: "0", desc: "Success" }],
      };

      markdown = createMarkdownDocumentation(parsedFunction).value;
    });

    test("it should include the description", () => {
      assert.ok(markdown.includes("**Description:**\nA test function."));
    });

    test("it should include arguments", () => {
      assert.ok(markdown.includes("**Arguments:**"));
      assert.ok(markdown.includes("* `arg1` _(string)_ - First argument"));
    });

    test("it should include options", () => {
      assert.ok(markdown.includes("**Options:**"));
      assert.ok(markdown.includes("* `-f` - Force"));
    });

    test("it should include exit codes", () => {
      assert.ok(markdown.includes("**Exit Codes:**"));
      assert.ok(markdown.includes("* `0` - Success"));
    });
  });

  suite("when generating documentation for a function without optional parts", () => {
    let markdown: string;

    setup(() => {
      const parsedFunction: ShdocFunction = {
        name: "simple_func",
        description: "Simple function.",
        args: [],
        options: [],
        exitcodes: [],
      };

      markdown = createMarkdownDocumentation(parsedFunction).value;
    });

    test("it should include the description", () => {
      assert.ok(markdown.includes("**Description:**\nSimple function."));
    });

    test("it should not include arguments section", () => {
      assert.strictEqual(markdown.includes("**Arguments:**"), false);
    });

    test("it should not include options section", () => {
      assert.strictEqual(markdown.includes("**Options:**"), false);
    });

    test("it should not include exit codes section", () => {
      assert.strictEqual(markdown.includes("**Exit Codes:**"), false);
    });
  });
});
