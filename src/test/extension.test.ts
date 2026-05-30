import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  const getExtension = () => {
    return vscode.extensions.all.find((e) => e.packageJSON.name === "bash-stdlib");
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

    suite("and completions are requested for shellscript", () => {
      let completions: vscode.CompletionList | undefined;

      setup(async () => {
        const document = await vscode.workspace.openTextDocument({
          language: "shellscript",
          content: "stdlib.",
        });
        const position = new vscode.Position(0, 7);

        completions = await vscode.commands.executeCommand<vscode.CompletionList>(
          "vscode.executeCompletionItemProvider",
          document.uri,
          position
        );
      });

      test("it should return a completion list", () => {
        assert.ok(completions, "Completion list should be returned");
      });

      test("it should contain function items", () => {
        const hasFunctions = completions?.items.some(
          (item) => item.kind === vscode.CompletionItemKind.Function
        );
        assert.strictEqual(hasFunctions, true, "Completion list should contain function items");
      });

      test("it should have completion items with documentation", () => {
          const itemsWithDoc = completions?.items.filter(item => item.documentation);
          assert.ok(itemsWithDoc && itemsWithDoc.length > 0, "Should have items with documentation");
      });
    });
  });
});
