import * as assert from "assert";
import * as vscode from "vscode";
import { isTestContext, getFunctionsForContext } from "@/shell/context";
import { ShdocFunction } from "@/shell/shdoc";

suite("Context Logic Test Suite", () => {
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

  suite("isTestContext", () => {
    test("it should return true if filename contains 'test'", () => {
      const mockDoc = {
        uri: vscode.Uri.file("/path/to/my_test.sh"),
      } as vscode.TextDocument;
      assert.strictEqual(isTestContext(mockDoc), true);
    });

    test("it should return true if path contains 'tests' folder", () => {
      const mockDoc = {
        uri: vscode.Uri.file("/path/to/tests/helper.sh"),
      } as vscode.TextDocument;
      assert.strictEqual(isTestContext(mockDoc), true);
    });

    test("it should return false if path does not contain 'test'", () => {
      const mockDoc = {
        uri: vscode.Uri.file("/path/to/script.sh"),
      } as vscode.TextDocument;
      assert.strictEqual(isTestContext(mockDoc), false);
    });

    test("it should be case-insensitive", () => {
      const mockDoc = {
        uri: vscode.Uri.file("/path/to/TEST_SCRIPT.sh"),
      } as vscode.TextDocument;
      assert.strictEqual(isTestContext(mockDoc), true);
    });
  });

  suite("getFunctionsForContext", () => {
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
});
