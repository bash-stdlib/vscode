import * as vscode from "vscode";
import * as assert from "assert";
import {
  createNamespaceCompletionItem,
  createFunctionCompletionItem,
} from "@/shell/completionItem";
import { ShdocFunction } from "@/shell/shdoc";

suite("Completion Item Test Suite", () => {
  suite("createNamespaceCompletionItem", () => {
    let item: vscode.CompletionItem;

    setup(() => {
      item = createNamespaceCompletionItem("string", "stdlib.string");
    });

    test("it should have the namespace as label", () => {
      assert.strictEqual(item.label, "string");
    });

    test("it should have Module kind", () => {
      assert.strictEqual(item.kind, vscode.CompletionItemKind.Module);
    });

    test("it should have the fully qualified name as detail", () => {
      assert.strictEqual(item.detail, "stdlib.string");
    });
  });

  suite("createFunctionCompletionItem", () => {
    suite("when function has a namespace and arguments", () => {
      let item: vscode.CompletionItem;
      const fn: ShdocFunction = {
        name: "join",
        namespace: "stdlib.string",
        description: "Joins elements.",
        args: [
          { name: "sep", type: "string", desc: "Separator" },
          { name: "arr", type: "array", desc: "Array" },
        ],
        exitcodes: [{ code: "0", desc: "Success" }],
        globals: [{ name: "GLOBAL_VAR", type: "string", desc: "A global var" }],
        isTesting: false,
        keywords: [{ name: "KEYWORD_VAR", type: "string", desc: "A keyword var" }],
        options: [{ flags: "-v", desc: "Verbose" }],
      };

      setup(() => {
        item = createFunctionCompletionItem(fn);
      });

      test("it should have namespaced label", () => {
        assert.strictEqual(item.label, "stdlib.string.join");
      });

      test("it should have Function kind", () => {
        assert.strictEqual(item.kind, vscode.CompletionItemKind.Function);
      });

      test("it should have correct detail with arguments", () => {
        assert.strictEqual(item.detail, "stdlib.string.join sep arr");
      });

      test("it should have documentation", () => {
        assert.ok(item.documentation instanceof vscode.MarkdownString);
        const doc = (item.documentation as vscode.MarkdownString).value;
        assert.ok(doc.includes("Joins elements."));
        assert.ok(doc.includes("sep"));
        assert.ok(doc.includes("GLOBAL_VAR"));
        assert.ok(doc.includes("KEYWORD_VAR"));
        assert.ok(doc.includes("-v"));
        assert.ok(doc.includes("Success"));
      });

      test("it should have snippet as insert text", () => {
        assert.ok(item.insertText instanceof vscode.SnippetString);
        assert.strictEqual(
          (item.insertText as vscode.SnippetString).value,
          "join ${1:sep} ${2:arr}",
        );
      });
    });

    suite("when function has no namespace and no arguments", () => {
      let item: vscode.CompletionItem;
      const fn: ShdocFunction = {
        name: "simple",
        description: "A simple function.",
        args: [],
        exitcodes: [],
        globals: [],
        isTesting: false,
        keywords: [],
        options: [],
      };

      setup(() => {
        item = createFunctionCompletionItem(fn);
      });

      test("it should have simple label", () => {
        assert.strictEqual(item.label, "simple");
      });

      test("it should have name as insert text", () => {
        assert.strictEqual(item.insertText, "simple");
      });
    });

    suite("when function has regular arguments and variadic arguments", () => {
      let item: vscode.CompletionItem;
      const fn: ShdocFunction = {
        name: "compose",
        namespace: "parametrize",
        description: "Composes functions.",
        args: [
          { name: "func", type: "string", desc: "Function name" },
          { name: "…", type: "variadic", desc: "Additional arguments" },
        ],
        exitcodes: [],
        globals: [],
        isTesting: false,
        keywords: [],
        options: [],
      };

      setup(() => {
        item = createFunctionCompletionItem(fn);
      });

      test("it should include variadic notation in detail", () => {
        assert.strictEqual(item.detail, "parametrize.compose func …");
      });

      test("it should not include variadic in snippet text", () => {
        assert.ok(item.insertText instanceof vscode.SnippetString);
        assert.strictEqual(
          (item.insertText as vscode.SnippetString).value,
          "compose ${1:func}",
        );
      });
    });

    suite("when function has only variadic arguments", () => {
      let item: vscode.CompletionItem;
      const fn: ShdocFunction = {
        name: "error",
        namespace: "_testing",
        description: "Reports an error.",
        args: [{ name: "…", type: "variadic", desc: "Error messages" }],
        exitcodes: [],
        globals: [],
        isTesting: true,
        keywords: [],
        options: [],
      };

      setup(() => {
        item = createFunctionCompletionItem(fn);
      });

      test("it should show only variadic in detail", () => {
        assert.strictEqual(item.detail, "_testing.error …");
      });

      test("it should have simple name in snippet", () => {
        assert.strictEqual(item.insertText, "error");
      });
    });
  });
});
