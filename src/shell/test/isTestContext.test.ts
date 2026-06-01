import * as assert from "assert";
import * as vscode from "vscode";
import { isTestContext } from "@/shell/context";

suite("isTestContext Logic Test Suite", () => {
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
