import * as vscode from "vscode";
import * as assert from "assert";
import { getCompletionsAt } from "@/test/testHelpers";

const getCompletionsForContent = async (options: {
  content: string;
  line: number;
  character: number;
}): Promise<vscode.CompletionList | undefined> => {
  const document = await vscode.workspace.openTextDocument({
    language: "shellscript",
    content: options.content,
  });

  return getCompletionsAt(document, options.line, options.character);
};

const getHoversForContent = async (options: {
  content: string;
  line: number;
  character: number;
}): Promise<vscode.Hover[] | undefined> => {
  const document = await vscode.workspace.openTextDocument({
    language: "shellscript",
    content: options.content,
  });
  const position = new vscode.Position(options.line, options.character);

  return vscode.commands.executeCommand<vscode.Hover[]>(
    "vscode.executeHoverProvider",
    document.uri,
    position,
  );
};

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  const getExtension = () => {
    return vscode.extensions.all.find(
      (e) => e.packageJSON.name === "bash-stdlib",
    );
  };

  test("extension should be present", () => {
    const extension = getExtension();
    assert.ok(extension);
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

    test("should be active", () => {
      assert.strictEqual(extension?.isActive, true);
    });

    suite("when completions are requested for shellscript", () => {
      suite("for bare dot", () => {
        let completions: vscode.CompletionList | undefined;

        setup(async () => {
          completions = await getCompletionsForContent({
            content: ".",
            line: 0,
            character: 1,
          });
        });

        test("should not return namespace completions", () => {
          const namespaceItems =
            completions?.items.filter(
              (item) => item.kind === vscode.CompletionItemKind.Module,
            ) ?? [];
          assert.strictEqual(namespaceItems.length, 0);
        });

        test("should not return function completions", () => {
          const functionItems =
            completions?.items.filter(
              (item) => item.kind === vscode.CompletionItemKind.Function,
            ) ?? [];
          assert.strictEqual(functionItems.length, 0);
        });
      });

      suite("for stdlib.array.assert", () => {
        let completions: vscode.CompletionList | undefined;

        setup(async () => {
          completions = await getCompletionsForContent({
            content: "stdlib.array.assert.",
            line: 0,
            character: 19,
          });
        });

        test("should return completions", () => {
          assert.ok(completions);
        });

        test("should include function completions", () => {
          const functionItems =
            completions?.items.filter(
              (item) => item.kind === vscode.CompletionItemKind.Function,
            ) ?? [];
          assert.ok(functionItems.length > 0);
        });

        test("function completions should have documentation", () => {
          const functionItems =
            completions?.items.filter(
              (item) => item.kind === vscode.CompletionItemKind.Function,
            ) ?? [];
          const itemsWithDoc = functionItems.filter(
            (item) => item.documentation,
          );
          assert.ok(itemsWithDoc.length > 0);
        });
      });

      suite("for stdlib namespace", () => {
        let completions: vscode.CompletionList | undefined;

        setup(async () => {
          completions = await getCompletionsForContent({
            content: "stdlib.",
            line: 0,
            character: 7,
          });
        });

        test("namespace completions should not include trailing dot", () => {
          const namespaceItems =
            completions?.items.filter(
              (item) => item.kind === vscode.CompletionItemKind.Module,
            ) ?? [];
          assert.ok(
            namespaceItems.every(
              (item) => !item.insertText?.toString().endsWith("."),
            ),
          );
        });
      });

      suite("for std prefix", () => {
        let completions: vscode.CompletionList | undefined;

        setup(async () => {
          completions = await getCompletionsForContent({
            content: "std",
            line: 0,
            character: 3,
          });
        });

        test("should return stdlib namespace", () => {
          const stdlibItem = completions?.items.find(
            (item) => item.label === "stdlib",
          );
          assert.ok(stdlibItem);
        });

        test("stdlib item should be a module kind", () => {
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

    suite("when hovering over functions in shellscript", () => {
      suite("hovering stdlib.array.is_empty", () => {
        let hovers: vscode.Hover[] | undefined;

        setup(async () => {
          hovers = await getHoversForContent({
            content: "stdlib.array.is_empty",
            line: 0,
            character: 15,
          });
        });

        test("should return hovers", () => {
          assert.ok(hovers);
        });

        test("should have at least one hover", () => {
          assert.ok(hovers && hovers.length > 0);
        });

        test("should have content", () => {
          assert.ok(hovers && hovers[0].contents.length > 0);
        });

        test("should include function name", () => {
          assert.ok(hovers && hovers.length > 0);
          const content = hovers[0].contents[0];
          const contentStr =
            typeof content === "string" ? content : content.value;
          assert.ok(contentStr.includes("is_empty"));
        });
      });

      suite("hovering stdlib.string.join", () => {
        let hovers: vscode.Hover[] | undefined;

        setup(async () => {
          hovers = await getHoversForContent({
            content: "stdlib.string.join",
            line: 0,
            character: 15,
          });
        });

        test("should have hover information", () => {
          assert.ok(hovers && hovers.length > 0);
        });

        test("should include documentation sections", () => {
          assert.ok(hovers && hovers.length > 0);
          const content = hovers[0].contents[0];
          const contentStr =
            typeof content === "string" ? content : content.value;
          assert.ok(
            contentStr.includes("Arguments") ||
              contentStr.includes("Description"),
          );
        });
      });

      suite("hovering empty space", () => {
        let hovers: vscode.Hover[] | undefined;

        setup(async () => {
          hovers = await getHoversForContent({
            content: "   ",
            line: 0,
            character: 1,
          });
        });

        test("should not return hover", () => {
          assert.ok(!hovers || hovers.length === 0);
        });
      });
    });
  });
});
