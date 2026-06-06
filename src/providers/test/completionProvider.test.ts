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

    test("it should return root namespaces matching the prefix", () => {
      const stdlib = completions.find((c) => c.label === "stdlib");
      assert.ok(stdlib);
      assert.strictEqual(stdlib.kind, vscode.CompletionItemKind.Module);
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

    test("it should return sub-namespaces", () => {
      const stringNs = completions.find((c) => c.label === "string");
      const arrayNs = completions.find((c) => c.label === "array");
      assert.ok(stringNs);
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

    test("it should return functions in that namespace", () => {
      const joinFn = completions.find(
        (c) => c.label === "join" || c.label === "stdlib.string.join",
      );
      const splitFn = completions.find(
        (c) => c.label === "split" || c.label === "stdlib.string.split",
      );
      assert.ok(
        joinFn,
        `join not found in: ${completions.map((c) => c.label).join(", ")}`,
      );
      assert.ok(splitFn);
      assert.strictEqual(joinFn.kind, vscode.CompletionItemKind.Function);
    });
  });

  suite("when in a test file context", () => {
    let completions: vscode.CompletionItem[];

    setup(async () => {
      const testFilePath = path.join(__dirname, "assets/context-aware.test.sh");
      const document = await vscode.workspace.openTextDocument(testFilePath);

      const position = new vscode.Position(0, 0); // content doesn't matter much for this test
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
