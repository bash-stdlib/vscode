import * as assert from "assert";
import * as vscode from "vscode";
import { getCompletionsAt } from "./testHelpers";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  const getExtension = () => {
    return vscode.extensions.all.find(
      (e) => e.packageJSON.name === "bash-stdlib",
    );
  };

  test("Extension should be present", () => {
    const extension = getExtension();
    assert.ok(extension, "Extension should be found by name in packageJSON");
  });

  suite("when extension is activated", () => {
    let extension: vscode.Extension<any> | undefined;

    setup(async () => {
      extension = getExtension();
      await extension?.activate();
      await vscode.workspace
        .getConfiguration("bash-stdlib")
        .update("debug", true, true);
    });

    test("it should be active", () => {
      assert.strictEqual(extension?.isActive, true);
    });

    suite("when completions are requested for shellscript", () => {
      suite("in a normal file (no 'test' in name)", () => {
        let document: vscode.TextDocument;

        setup(async () => {
          document = await vscode.workspace.openTextDocument({
            language: "shellscript",
            content: "stdlib.",
          });
        });

        test("typing just '.' should not return namespace or function suggestions", async () => {
          const doc = await vscode.workspace.openTextDocument({
            language: "shellscript",
            content: ".",
          });
          const completions = await getCompletionsAt(doc, 0, 1);

          const namespaceItems = completions?.items.filter(
            (item) => item.kind === vscode.CompletionItemKind.Module,
          );
          const functionItems = completions?.items.filter(
            (item) => item.kind === vscode.CompletionItemKind.Function,
          );

          assert.strictEqual(
            (namespaceItems?.length || 0) + (functionItems?.length || 0),
            0,
            "Bare dot should not return namespace or function completions",
          );
        });

        test("typing 'stdlib.array.assert.' should return function completions", async () => {
          const doc = await vscode.workspace.openTextDocument({
            language: "shellscript",
            content: "stdlib.array.assert.",
          });
          const completions = await getCompletionsAt(doc, 0, 19);

          assert.ok(completions, "Completion list should be returned");
          const functionItems = completions?.items.filter(
            (item) => item.kind === vscode.CompletionItemKind.Function,
          );
          assert.ok(
            functionItems && functionItems.length > 0,
            "Should have function suggestions in stdlib.array.assert namespace",
          );
        });

        test("completion items should have documentation", async () => {
          const doc = await vscode.workspace.openTextDocument({
            language: "shellscript",
            content: "stdlib.array.assert.",
          });
          const completions = await getCompletionsAt(doc, 0, 19);

          const functionItems = completions?.items.filter(
            (item) => item.kind === vscode.CompletionItemKind.Function,
          );
          assert.ok(
            functionItems && functionItems.length > 0,
            "Should have function items",
          );

          const itemsWithDoc = functionItems?.filter(
            (item) => item.documentation,
          );
          assert.ok(
            itemsWithDoc && itemsWithDoc.length > 0,
            "Function completions should have documentation",
          );
        });

        test("namespace completion items should not include dot", async () => {
          const doc = await vscode.workspace.openTextDocument({
            language: "shellscript",
            content: "stdlib.",
          });
          const completions = await getCompletionsAt(doc, 0, 7);

          const namespaceItems = completions?.items.filter(
            (item) => item.kind === vscode.CompletionItemKind.Module,
          );
          assert.ok(
            namespaceItems &&
              namespaceItems.every(
                (item) => !item.insertText?.toString().endsWith("."),
              ),
            "Namespace items should not end with dot in insertText",
          );
        });

        suite("when typing partial root namespaces", () => {
          suite("typing 'std' prefix", () => {
            let completions: vscode.CompletionList | undefined;

            setup(async () => {
              const doc = await vscode.workspace.openTextDocument({
                language: "shellscript",
                content: "std",
              });
              completions = await getCompletionsAt(doc, 0, 3);
            });

            test("it should return stdlib namespace", () => {
              const stdlibItem = completions?.items.find(
                (item) => item.label === "stdlib",
              );
              assert.ok(stdlibItem, "Should have stdlib namespace completion");
            });

            test("it should be a module kind", () => {
              const stdlibItem = completions?.items.find(
                (item) => item.label === "stdlib",
              );
              assert.strictEqual(
                stdlibItem?.kind,
                vscode.CompletionItemKind.Module,
              );
            });
          });
        });
      });
    });

    suite("when hovering over functions in shellscript", () => {
      test("hovering over 'stdlib.array.is_empty' should return hover information", async () => {
        const document = await vscode.workspace.openTextDocument({
          language: "shellscript",
          content: "stdlib.array.is_empty",
        });
        const position = new vscode.Position(0, 15);

        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
          "vscode.executeHoverProvider",
          document.uri,
          position,
        );

        assert.ok(hovers, "Hover information should be returned");
        assert.ok(
          hovers && hovers.length > 0,
          "Should have at least one hover",
        );
        assert.ok(
          hovers && hovers[0].contents.length > 0,
          "Hover should have content",
        );
      });

      test("hovering over a namespaced function should show full documentation", async () => {
        const document = await vscode.workspace.openTextDocument({
          language: "shellscript",
          content: "stdlib.string.join",
        });
        const position = new vscode.Position(0, 15);

        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
          "vscode.executeHoverProvider",
          document.uri,
          position,
        );

        assert.ok(hovers && hovers.length > 0, "Should have hover information");
        const content = hovers[0].contents[0];
        const contentStr =
          typeof content === "string" ? content : content.value;
        assert.ok(
          contentStr.includes("Arguments") ||
            contentStr.includes("Description"),
          "Hover should include documentation sections",
        );
      });

      test("hovering over a real function should contain its name in documentation", async () => {
        const document = await vscode.workspace.openTextDocument({
          language: "shellscript",
          content: "stdlib.array.is_empty",
        });
        const position = new vscode.Position(0, 15);

        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
          "vscode.executeHoverProvider",
          document.uri,
          position,
        );

        assert.ok(hovers && hovers.length > 0, "Should have hover information");
        const content = hovers[0].contents[0];
        const contentStr =
          typeof content === "string" ? content : content.value;
        assert.ok(
          contentStr.includes("is_empty"),
          "Hover should include the function name",
        );
      });

      test("hovering at position with no identifier should return null", async () => {
        const document = await vscode.workspace.openTextDocument({
          language: "shellscript",
          content: "   ",
        });
        const position = new vscode.Position(0, 1);

        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
          "vscode.executeHoverProvider",
          document.uri,
          position,
        );

        assert.ok(
          !hovers || hovers.length === 0,
          "Should not have hover for empty space",
        );
      });
    });
  });
});
