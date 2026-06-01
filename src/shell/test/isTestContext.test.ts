import * as assert from "assert";
import * as vscode from "vscode";
import { isTestContext } from "@/shell/context";

suite("isTestContext Logic Test Suite", () => {
  suite("when path contains 'test' in the filename", () => {
    let result: boolean;

    setup(() => {
      const mockDoc = {
        uri: vscode.Uri.file("/path/to/my_test.sh"),
      } as vscode.TextDocument;
      result = isTestContext(mockDoc);
    });

    test("it should return true", () => {
      assert.strictEqual(result, true);
    });
  });

  suite("when path contains 'tests' folder", () => {
    let result: boolean;

    setup(() => {
      const mockDoc = {
        uri: vscode.Uri.file("/path/to/tests/helper.sh"),
      } as vscode.TextDocument;
      result = isTestContext(mockDoc);
    });

    test("it should return true", () => {
      assert.strictEqual(result, true);
    });
  });

  suite("when path does not contain 'test'", () => {
    let result: boolean;

    setup(() => {
      const mockDoc = {
        uri: vscode.Uri.file("/path/to/script.sh"),
      } as vscode.TextDocument;
      result = isTestContext(mockDoc);
    });

    test("it should return false", () => {
      assert.strictEqual(result, false);
    });
  });

  suite("when path contains uppercase 'TEST'", () => {
    let result: boolean;

    setup(() => {
      const mockDoc = {
        uri: vscode.Uri.file("/path/to/TEST_SCRIPT.sh"),
      } as vscode.TextDocument;
      result = isTestContext(mockDoc);
    });

    test("it should return true", () => {
      assert.strictEqual(result, true);
    });
  });
});
