import * as vscode from "vscode";
import * as assert from "assert";
import {
  clearDocument,
  getCompletionsAt,
  insertText,
} from "@/test/testHelpers";

suite("Context Aware Completion Integration Test Suite", () => {
  const getExtension = () => {
    return vscode.extensions.all.find(
      (e) => e.packageJSON.name === "bash-stdlib",
    );
  };

  suite("when extension is activated", () => {
    setup(async () => {
      const extension = getExtension();

      await extension?.activate();
    });

    suite("in a normal file (no 'test' in path)", () => {
      let document: vscode.TextDocument;

      setup(async () => {
        document = await vscode.workspace.openTextDocument({
          language: "shellscript",
          content: "stdlib.",
        });
      });

      suite("when typing 'stdlib.'", () => {
        let completions: vscode.CompletionList | undefined;

        setup(async () => {
          completions = await getCompletionsAt(document, 0, 7);
        });

        test("it should return namespace suggestions", () => {
          assert.ok(completions);
        });

        test("it should have array namespace suggestion", () => {
          const namespaceItems = completions?.items.filter(
            (item) => item.kind === vscode.CompletionItemKind.Module,
          );

          assert.ok(
            namespaceItems &&
              namespaceItems.some((item) => item.label === "array"),
          );
        });
      });

      suite("when typing partial root namespaces", () => {
        suite("typing '_te' prefix", () => {
          let completions: vscode.CompletionList | undefined;

          setup(async () => {
            const doc = await vscode.workspace.openTextDocument({
              language: "shellscript",
              content: "_te",
            });

            completions = await getCompletionsAt(doc, 0, 3);
          });

          test("it should NOT return _testing namespace", () => {
            const testingItem = completions?.items.find(
              (item) => item.label === "_testing",
            );

            assert.ok(!testingItem);
          });
        });
      });
    });

    suite("in a test file ('test' in path)", () => {
      let document: vscode.TextDocument;

      setup(async () => {
        const uri = vscode.Uri.parse("untitled:my_test_script.sh");
        document = await vscode.workspace.openTextDocument(uri);

        await vscode.languages.setTextDocumentLanguage(document, "shellscript");
      });

      suite("when typing '_te'", () => {
        let completions: vscode.CompletionList | undefined;

        setup(async () => {
          await insertText(document, "_te");

          completions = await getCompletionsAt(document, 0, 3);
        });

        test("it should return _testing namespace", () => {
          const testingItem = completions?.items.find(
            (item) => item.label === "_testing",
          );

          assert.ok(testingItem);
        });
      });

      suite("when typing 'std'", () => {
        let completions: vscode.CompletionList | undefined;

        setup(async () => {
          await clearDocument(document);
          await insertText(document, "std");

          completions = await getCompletionsAt(document, 0, 3);
        });

        test("it should return stdlib namespace", () => {
          const stdlibItem = completions?.items.find(
            (item) => item.label === "stdlib",
          );

          assert.ok(stdlibItem);
        });
      });
    });
  });
});
