import * as vscode from "vscode";
import * as assert from "assert";
import { getFunctionsForContext } from "@/shell/context";
import { ShdocFunction } from "@/shell/shdoc";

suite("getFunctionsForContext Logic Test Suite", () => {
  const mockFunctions: ShdocFunction[] = [
    {
      name: "normal_fn",
      isTesting: false,
      globals: [],
      keywords: [],
      args: [],
      description: "",
      exitcodes: [],
      options: [],
    },
    {
      name: "test_fn",
      isTesting: true,
      globals: [],
      keywords: [],
      args: [],
      description: "",
      exitcodes: [],
      options: [],
    },
  ];

  const mockTemplates: ShdocFunction[] = [
    {
      name: "object",
      isTesting: true,
      globals: [],
      keywords: [],
      args: [],
      description: "",
      exitcodes: [],
      options: [],
    },
  ];

  suite("when in a test context", () => {
    let result: ShdocFunction[];

    setup(() => {
      const content = "_mock.create example\n";
      const mockDoc = {
        uri: vscode.Uri.file("/path/to/test.sh"),
        getText: () => content,
        lineAt: (line: number) => ({
          text: content.split("\n")[line],
        }),
      } as unknown as vscode.TextDocument;
      const position = new vscode.Position(1, 0);
      result = getFunctionsForContext(
        mockFunctions,
        mockTemplates,
        mockDoc,
        position,
      );
    });

    test("it should return all functions including generated mock functions", () => {
      assert.strictEqual(result.length, 3);
    });

    test("it should include the generated mock function", () => {
      assert.ok(result.find((fn) => fn.name === "example"));
    });
  });

  suite("when not in a test context", () => {
    let result: ShdocFunction[];

    setup(() => {
      const mockDoc = {
        uri: vscode.Uri.file("/path/to/normal.sh"),
      } as vscode.TextDocument;
      result = getFunctionsForContext(mockFunctions, [], mockDoc);
    });

    test("it should return only normal functions", () => {
      assert.strictEqual(result.length, 1);
    });

    test("it should include the normal function", () => {
      assert.strictEqual(result[0].name, "normal_fn");
    });
  });
});
