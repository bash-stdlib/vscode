import * as vscode from "vscode";
import * as assert from "assert";
import { getFunctionsForContext } from "@/shell/context";
import { ShdocFunction } from "@/shell/shdoc";

suite("getFunctionsForContext Logic Test Suite", () => {
  const mockFunctions: ShdocFunction[] = [
    {
      name: "normal_fn",
      isTesting: false, globals: [], keywords: [],
      args: [],
      description: "",
      exitcodes: [],
      options: [],
    },
    {
      name: "test_fn",
      isTesting: true, globals: [], keywords: [],
      args: [],
      description: "",
      exitcodes: [],
      options: [],
    },
  ];

  suite("when in a test context", () => {
    let result: ShdocFunction[];

    setup(() => {
      const mockDoc = {
        uri: vscode.Uri.file("/path/to/test.sh"),
      } as vscode.TextDocument;
      result = getFunctionsForContext(mockFunctions, mockDoc);
    });

    test("it should return all functions", () => {
      assert.strictEqual(result.length, 2);
    });
  });

  suite("when not in a test context", () => {
    let result: ShdocFunction[];

    setup(() => {
      const mockDoc = {
        uri: vscode.Uri.file("/path/to/normal.sh"),
      } as vscode.TextDocument;
      result = getFunctionsForContext(mockFunctions, mockDoc);
    });

    test("it should return only normal functions", () => {
      assert.strictEqual(result.length, 1);
    });

    test("it should include the normal function", () => {
      assert.strictEqual(result[0].name, "normal_fn");
    });
  });
});
