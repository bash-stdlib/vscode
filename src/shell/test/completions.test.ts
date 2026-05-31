import * as assert from "assert";
import * as vscode from "vscode";
import { createCompletionItem } from "@/shell/completions";
import { ShdocFunction } from "@/shell/shdoc";

suite("Completions Test Suite", () => {
  suite("when creating a completion item for a function with arguments", () => {
    let completionItem: vscode.CompletionItem;

    setup(() => {
      const parsedFunction: ShdocFunction = {
        name: "func_with_args",
        description: "Has arguments.",
        args: [
          { name: "first", type: "string", desc: "First arg" },
          { name: "second", type: "number", desc: "Second arg" },
        ],
        options: [],
        exitcodes: [],
      };

      completionItem = createCompletionItem(parsedFunction);
    });

    test("it should have the correct label", () => {
      assert.strictEqual(completionItem.label, "func_with_args");
    });

    test("it should have the correct kind", () => {
      assert.strictEqual(completionItem.kind, vscode.CompletionItemKind.Function);
    });

    test("it should have a detailed signature", () => {
      assert.strictEqual(completionItem.detail, "func_with_args first second");
    });

    test("it should have documentation", () => {
      assert.ok(completionItem.documentation);
    });

    test("it should have a snippet as insert text", () => {
      const snippet = completionItem.insertText as vscode.SnippetString;
      assert.strictEqual(snippet.value, "func_with_args ${1:first} ${2:second}");
    });
  });

  suite("when creating a completion item for a function without arguments", () => {
    let completionItem: vscode.CompletionItem;

    setup(() => {
      const parsedFunction: ShdocFunction = {
        name: "no_args_func",
        description: "No arguments.",
        args: [],
        options: [],
        exitcodes: [],
      };

      completionItem = createCompletionItem(parsedFunction);
    });

    test("it should have the function name as insert text", () => {
      assert.strictEqual(completionItem.insertText, "no_args_func");
    });

    test("it should have a simple signature", () => {
      assert.strictEqual(completionItem.detail, "no_args_func");
    });
  });
});
