import * as assert from "assert";
import * as vscode from "vscode";
import { getFunctionsForContext } from "@/shell/context";
import { ShdocFunction } from "@/shell/shdoc";

suite("getFunctionsForContext Logic Test Suite", () => {
  const mockFunctions: ShdocFunction[] = [
    {
      name: "normal_fn",
      isTesting: false,
      args: [],
      description: "",
      exitcodes: [],
      options: [],
    },
    {
      name: "test_fn",
      isTesting: true,
      args: [],
      description: "",
      exitcodes: [],
      options: [],
    },
  ];

  test("it should return all functions in test context", () => {
    const mockDoc = {
      uri: vscode.Uri.file("/path/to/test.sh"),
    } as vscode.TextDocument;
    const result = getFunctionsForContext(mockFunctions, mockDoc);
    assert.strictEqual(result.length, 2);
  });

  test("it should return only normal functions in non-test context", () => {
    const mockDoc = {
      uri: vscode.Uri.file("/path/to/normal.sh"),
    } as vscode.TextDocument;
    const result = getFunctionsForContext(mockFunctions, mockDoc);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, "normal_fn");
  });
});
