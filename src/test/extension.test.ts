import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  const getExtension = () => {
    return vscode.extensions.all.find((e) => e.packageJSON.name === "bash-stdlib");
  };

  test("Extension should be present", () => {
    // Arrange & Act
    const extension = getExtension();

    // Assert
    assert.ok(extension, "Extension should be found by name in packageJSON");
  });

  suite("when extension is activated", () => {
    let extension: vscode.Extension<any> | undefined;

    setup(async () => {
      // Arrange
      extension = getExtension();

      // Act
      await extension?.activate();
    });

    test("it should be active", () => {
      // Assert
      assert.strictEqual(extension?.isActive, true);
    });

    suite("and completions are requested for shellscript", () => {
      let completions: vscode.CompletionList | undefined;

      setup(async () => {
        // Arrange
        const document = await vscode.workspace.openTextDocument({
          language: "shellscript",
          content: "stdlib.",
        });
        const position = new vscode.Position(0, 7);

        // Act
        completions = await vscode.commands.executeCommand<vscode.CompletionList>(
          "vscode.executeCompletionItemProvider",
          document.uri,
          position
        );
      });

      test("it should return a completion list", () => {
        // Assert
        assert.ok(completions, "Completion list should be returned");
      });
    });
  });
});
