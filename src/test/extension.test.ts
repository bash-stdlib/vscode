import * as assert from "assert";
import * as vscode from "vscode";

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
    });

    test("it should be active", () => {
      assert.strictEqual(extension?.isActive, true);
    });

    suite("when completions are requested for shellscript", () => {
      test("typing 'stdlib.' should return namespace suggestions", async () => {
        const document = await vscode.workspace.openTextDocument({
          language: "shellscript",
          content: "stdlib.",
        });
        const position = new vscode.Position(0, 7);

        const completions =
          await vscode.commands.executeCommand<vscode.CompletionList>(
            "vscode.executeCompletionItemProvider",
            document.uri,
            position,
          );

        assert.ok(completions, "Completion list should be returned");
        const namespaceItems = completions?.items.filter(
          (item) => item.kind === vscode.CompletionItemKind.Module,
        );
        assert.ok(
          namespaceItems && namespaceItems.length > 0,
          "Should have namespace suggestions after stdlib.",
        );
      });

      test("typing just '.' should not return namespace or function suggestions", async () => {
        const document = await vscode.workspace.openTextDocument({
          language: "shellscript",
          content: ".",
        });
        const position = new vscode.Position(0, 1);

        const completions =
          await vscode.commands.executeCommand<vscode.CompletionList>(
            "vscode.executeCompletionItemProvider",
            document.uri,
            position,
          );

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
        const document = await vscode.workspace.openTextDocument({
          language: "shellscript",
          content: "stdlib.array.assert.",
        });
        const position = new vscode.Position(0, 19);

        const completions =
          await vscode.commands.executeCommand<vscode.CompletionList>(
            "vscode.executeCompletionItemProvider",
            document.uri,
            position,
          );

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
        const document = await vscode.workspace.openTextDocument({
          language: "shellscript",
          content: "stdlib.array.assert.",
        });
        const position = new vscode.Position(0, 19);

        const completions =
          await vscode.commands.executeCommand<vscode.CompletionList>(
            "vscode.executeCompletionItemProvider",
            document.uri,
            position,
          );

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
        const document = await vscode.workspace.openTextDocument({
          language: "shellscript",
          content: "stdlib.",
        });
        const position = new vscode.Position(0, 7);

        const completions =
          await vscode.commands.executeCommand<vscode.CompletionList>(
            "vscode.executeCompletionItemProvider",
            document.uri,
            position,
          );

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
        suite("typing '_te' prefix", () => {
          let completions: vscode.CompletionList | undefined;

          setup(async () => {
            const document = await vscode.workspace.openTextDocument({
              language: "shellscript",
              content: "_te",
            });
            const position = new vscode.Position(0, 3);

            completions = await vscode.commands.executeCommand<vscode.CompletionList>(
              "vscode.executeCompletionItemProvider",
              document.uri,
              position,
            );
          });

          test("it should return _testing namespace", () => {
            const testingItem = completions?.items.find(
              (item) => item.label === "_testing",
            );
            assert.ok(testingItem, "Should have _testing namespace completion");
          });

          test("it should be a module kind", () => {
            const testingItem = completions?.items.find(
              (item) => item.label === "_testing",
            );
            assert.strictEqual(
              testingItem?.kind,
              vscode.CompletionItemKind.Module,
            );
          });
        });

        suite("typing '_m' prefix", () => {
          let completions: vscode.CompletionList | undefined;

          setup(async () => {
            const document = await vscode.workspace.openTextDocument({
              language: "shellscript",
              content: "_m",
            });
            const position = new vscode.Position(0, 2);

            completions = await vscode.commands.executeCommand<vscode.CompletionList>(
              "vscode.executeCompletionItemProvider",
              document.uri,
              position,
            );
          });

          test("it should return _mock namespace", () => {
            const mockItem = completions?.items.find(
              (item) => item.label === "_mock",
            );
            assert.ok(mockItem, "Should have _mock namespace completion");
          });

          test("it should be a module kind", () => {
            const mockItem = completions?.items.find(
              (item) => item.label === "_mock",
            );
            assert.strictEqual(mockItem?.kind, vscode.CompletionItemKind.Module);
          });
        });

        suite("typing 'std' prefix", () => {
          let completions: vscode.CompletionList | undefined;

          setup(async () => {
            const document = await vscode.workspace.openTextDocument({
              language: "shellscript",
              content: "std",
            });
            const position = new vscode.Position(0, 3);

            completions = await vscode.commands.executeCommand<vscode.CompletionList>(
              "vscode.executeCompletionItemProvider",
              document.uri,
              position,
            );
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
            assert.strictEqual(stdlibItem?.kind, vscode.CompletionItemKind.Module);
          });
        });
      });
    });
  });
});
