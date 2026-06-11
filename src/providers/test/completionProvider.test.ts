import * as vscode from "vscode";
import * as assert from "assert";
import * as path from "path";
import { createCompletionProvider } from "@/providers/completionProvider";
import { ShdocFunction } from "@/shell/shdoc";

suite("Completion Provider Test Suite", () => {
  const mockFunctions: ShdocFunction[] = [
    {
      name: "join",
      namespace: "stdlib.string",
      description: "Join array elements",
      args: [],
      globals: [],
      isTesting: false,
      keywords: [],
      options: [],
      exitcodes: [],
    },
    {
      name: "split",
      namespace: "stdlib.string",
      description: "Split string",
      args: [],
      globals: [],
      isTesting: false,
      keywords: [],
      options: [],
      exitcodes: [],
    },
    {
      name: "is_empty",
      namespace: "stdlib.array",
      description: "Check if array is empty",
      args: [],
      globals: [],
      isTesting: false,
      keywords: [],
      options: [],
      exitcodes: [],
    },
    {
      name: "root_func",
      description: "A root level function",
      args: [],
      globals: [],
      isTesting: false,
      keywords: [],
      options: [],
      exitcodes: [],
    },
    {
      name: "assert",
      namespace: "_testing.assert",
      description: "Assert condition",
      args: [],
      globals: [],
      isTesting: true,
      keywords: [],
      options: [],
      exitcodes: [],
    },
  ];

  const provider = createCompletionProvider(mockFunctions, []);

  suite("when providing root completions", () => {
    let completions: vscode.CompletionItem[];

    setup(async () => {
      const document = await vscode.workspace.openTextDocument({
        language: "shellscript",
        content: "s",
      });
      const position = new vscode.Position(0, 1);

      const result = await provider.provideCompletionItems(
        document,
        position,
        new vscode.CancellationTokenSource().token,
        {
          triggerKind: vscode.CompletionTriggerKind.Invoke,
          triggerCharacter: undefined,
        },
      );
      completions = (result as vscode.CompletionItem[]) || [];
    });

    test("it should return stdlib namespace", () => {
      const stdlib = completions.find((c) => c.label === "stdlib");
      assert.ok(stdlib);
    });

    test("stdlib item should have module kind", () => {
      const stdlib = completions.find((c) => c.label === "stdlib");
      assert.strictEqual(stdlib?.kind, vscode.CompletionItemKind.Module);
    });

    test("it should not return namespaces that do not match the prefix", () => {
      const testing = completions.find((c) => c.label === "_testing");
      assert.strictEqual(testing, undefined);
    });
  });

  suite("when providing completions after a dot", () => {
    let completions: vscode.CompletionItem[];

    setup(async () => {
      const document = await vscode.workspace.openTextDocument({
        language: "shellscript",
        content: "stdlib.",
      });
      const position = new vscode.Position(0, 7);

      const result = await provider.provideCompletionItems(
        document,
        position,
        new vscode.CancellationTokenSource().token,
        {
          triggerKind: vscode.CompletionTriggerKind.TriggerCharacter,
          triggerCharacter: ".",
        },
      );
      completions = (result as vscode.CompletionItem[]) || [];
    });

    test("it should return string sub-namespace", () => {
      const stringNs = completions.find((c) => c.label === "string");
      assert.ok(stringNs);
    });

    test("it should return array sub-namespace", () => {
      const arrayNs = completions.find((c) => c.label === "array");
      assert.ok(arrayNs);
    });
  });

  suite("when providing completions within a namespace", () => {
    let completions: vscode.CompletionItem[];

    setup(async () => {
      const document = await vscode.workspace.openTextDocument({
        language: "shellscript",
        content: "stdlib.string.",
      });
      const position = new vscode.Position(0, 14);

      const result = await provider.provideCompletionItems(
        document,
        position,
        new vscode.CancellationTokenSource().token,
        {
          triggerKind: vscode.CompletionTriggerKind.TriggerCharacter,
          triggerCharacter: ".",
        },
      );
      completions = (result as vscode.CompletionItem[]) || [];
    });

    test("it should return join function", () => {
      const joinFn = completions.find(
        (c) => c.label === "join" || c.label === "stdlib.string.join",
      );
      assert.ok(joinFn);
    });

    test("join function should have function kind", () => {
      const joinFn = completions.find(
        (c) => c.label === "join" || c.label === "stdlib.string.join",
      );
      assert.strictEqual(joinFn?.kind, vscode.CompletionItemKind.Function);
    });

    test("it should return split function", () => {
      const splitFn = completions.find(
        (c) => c.label === "split" || c.label === "stdlib.string.split",
      );
      assert.ok(splitFn);
    });
  });

  suite("when in a test file context", () => {
    let completions: vscode.CompletionItem[];

    setup(async () => {
      const testFilePath = path.join(__dirname, "assets/context-aware.test.sh");
      const document = await vscode.workspace.openTextDocument(testFilePath);
      const position = new vscode.Position(0, 0);

      const result = await provider.provideCompletionItems(
        document,
        position,
        new vscode.CancellationTokenSource().token,
        {
          triggerKind: vscode.CompletionTriggerKind.Invoke,
          triggerCharacter: undefined,
        },
      );
      completions = (result as vscode.CompletionItem[]) || [];
    });

    test("it should return testing namespaces", () => {
      const testingNs = completions.find((c) => c.label === "_testing");
      assert.ok(testingNs);
    });
  });
});
