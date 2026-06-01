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
      suite("in a normal file (no 'test' in name)", () => {
        let document: vscode.TextDocument;

        setup(async () => {
          document = await vscode.workspace.openTextDocument({
            language: "shellscript",
            content: "stdlib.",
          });
        });

        test("typing 'stdlib.' should return namespace suggestions", async () => {
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
            namespaceItems &&
              namespaceItems.some((item) => item.label === "array"),
            "Should have array namespace suggestion under stdlib. in normal file",
          );
        });

        test("typing just '.' should not return namespace or function suggestions", async () => {
          const doc = await vscode.workspace.openTextDocument({
            language: "shellscript",
            content: ".",
          });
          const position = new vscode.Position(0, 1);

          const completions =
            await vscode.commands.executeCommand<vscode.CompletionList>(
              "vscode.executeCompletionItemProvider",
              doc.uri,
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
          const doc = await vscode.workspace.openTextDocument({
            language: "shellscript",
            content: "stdlib.array.assert.",
          });
          const position = new vscode.Position(0, 19);

          const completions =
            await vscode.commands.executeCommand<vscode.CompletionList>(
              "vscode.executeCompletionItemProvider",
              doc.uri,
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
          const doc = await vscode.workspace.openTextDocument({
            language: "shellscript",
            content: "stdlib.array.assert.",
          });
          const position = new vscode.Position(0, 19);

          const completions =
            await vscode.commands.executeCommand<vscode.CompletionList>(
              "vscode.executeCompletionItemProvider",
              doc.uri,
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
          const doc = await vscode.workspace.openTextDocument({
            language: "shellscript",
            content: "stdlib.",
          });
          const position = new vscode.Position(0, 7);

          const completions =
            await vscode.commands.executeCommand<vscode.CompletionList>(
              "vscode.executeCompletionItemProvider",
              doc.uri,
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
              const doc = await vscode.workspace.openTextDocument({
                language: "shellscript",
                content: "_te",
              });
              const position = new vscode.Position(0, 3);

              completions =
                await vscode.commands.executeCommand<vscode.CompletionList>(
                  "vscode.executeCompletionItemProvider",
                  doc.uri,
                  position,
                );
            });

            test("it should NOT return _testing namespace in normal file", () => {
              const testingItem = completions?.items.find(
                (item) => item.label === "_testing",
              );
              assert.ok(
                !testingItem,
                "Should NOT have _testing namespace completion in normal file",
              );
            });
          });

          suite("typing 'std' prefix", () => {
            let completions: vscode.CompletionList | undefined;

            setup(async () => {
              const doc = await vscode.workspace.openTextDocument({
                language: "shellscript",
                content: "std",
              });
              const position = new vscode.Position(0, 3);

              completions =
                await vscode.commands.executeCommand<vscode.CompletionList>(
                  "vscode.executeCompletionItemProvider",
                  doc.uri,
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
              assert.strictEqual(
                stdlibItem?.kind,
                vscode.CompletionItemKind.Module,
              );
            });
          });
        });
      });

      suite("in a test file ('test' in name)", () => {
        let document: vscode.TextDocument;

        setup(async () => {
          const uri = vscode.Uri.parse("untitled:my_test_script.sh");
          document = await vscode.workspace.openTextDocument(uri);
          await vscode.languages.setTextDocumentLanguage(
            document,
            "shellscript",
          );
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

async function clearDocument(document: vscode.TextDocument) {
  const edit = new vscode.WorkspaceEdit();
  edit.delete(
    document.uri,
    new vscode.Range(0, 0, document.lineCount, 0),
  );
  await vscode.workspace.applyEdit(edit);
}

async function getCompletionsAt(
  document: vscode.TextDocument,
  line: number,
  character: number,
) {
  return await vscode.commands.executeCommand<vscode.CompletionList>(
    "vscode.executeCompletionItemProvider",
    document.uri,
    new vscode.Position(line, character),
  );
}

async function insertText(document: vscode.TextDocument, text: string) {
  const edit = new vscode.WorkspaceEdit();
  edit.insert(document.uri, new vscode.Position(0, 0), text);
  await vscode.workspace.applyEdit(edit);
}
