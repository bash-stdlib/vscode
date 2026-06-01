import * as assert from "assert";
import * as vscode from "vscode";
import {
  clearDocument,
  getCompletionsAt,
  insertText,
} from "./testHelpers";

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

    suite("in a normal file (no 'test' in name)", () => {
      let document: vscode.TextDocument;

      setup(async () => {
        document = await vscode.workspace.openTextDocument({
          language: "shellscript",
          content: "stdlib.",
        });
      });

      test("typing 'stdlib.' should return namespace suggestions", async () => {
        const completions = await getCompletionsAt(document, 0, 7);

        assert.ok(completions, "Completion list should be returned");
        const namespaceItems = completions?.items.filter(
          (item) => item.kind === vscode.CompletionItemKind.Module,
        );
        assert.ok(
          namespaceItems &&
            namespaceItems.some((item) => item.label === "array"),
          "Should have array namespace suggestion under stdlib. in normal file",
        );
      });

      suite("when typing partial root namespaces", () => {
        test("it should NOT return _testing namespace in normal file", async () => {
          const doc = await vscode.workspace.openTextDocument({
            language: "shellscript",
            content: "_te",
          });
          const completions = await getCompletionsAt(doc, 0, 3);

          const testingItem = completions?.items.find(
            (item) => item.label === "_testing",
          );
          assert.ok(
            !testingItem,
            "Should NOT have _testing namespace completion in normal file",
          );
        });
      });
    });

    suite("in a test file ('test' in name)", () => {
      let document: vscode.TextDocument;

      setup(async () => {
        const uri = vscode.Uri.parse("untitled:my_test_script.sh");
        document = await vscode.workspace.openTextDocument(uri);
        await vscode.languages.setTextDocumentLanguage(document, "shellscript");
      });

      test("typing '_te' should return _testing namespace", async () => {
        await insertText(document, "_te");

        const completions = await getCompletionsAt(document, 0, 3);

        const testingItem = completions?.items.find(
          (item) => item.label === "_testing",
        );
        assert.ok(testingItem);
      });

      test("typing 'std' should return stdlib namespace", async () => {
        await clearDocument(document);
        await insertText(document, "std");

        const completions = await getCompletionsAt(document, 0, 3);

        const stdlibItem = completions?.items.find(
          (item) => item.label === "stdlib",
        );
        assert.ok(stdlibItem);
      });
    });
  });
});
