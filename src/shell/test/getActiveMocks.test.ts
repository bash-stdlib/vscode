import * as vscode from "vscode";
import * as assert from "assert";
import { getActiveMocks } from "@/providers/completion/mocks";

suite("getActiveMocks", () => {
  function createMockDocument(content: string): vscode.TextDocument {
    return {
      getText: (range?: vscode.Range) => {
        if (!range) {
          return content;
        }
        const lines = content.split("\n");
        const startLine = range.start.line;
        const endLine = range.end.line;
        const startChar = range.start.character;
        const endChar = range.end.character;

        if (startLine === endLine) {
          return lines[startLine].substring(startChar, endChar);
        }

        let result = lines[startLine].substring(startChar) + "\n";
        for (let i = startLine + 1; i < endLine; i++) {
          result += lines[i] + "\n";
        }
        result += lines[endLine].substring(0, endChar);
        return result;
      },
      lineCount: content.split("\n").length,
      lineAt: (line: number) => ({
        text: content.split("\n")[line],
      }),
    } as unknown as vscode.TextDocument;
  }

  test("when no mocks are created", () => {
    const content = "echo hello";
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 10);
    const activeMocks = getActiveMocks(document, position);
    assert.strictEqual(activeMocks.length, 0);
  });

  test("when a mock is created", () => {
    const content = "_mock.create example\n";
    const document = createMockDocument(content);
    const position = new vscode.Position(1, 0);
    const activeMocks = getActiveMocks(document, position);
    assert.deepStrictEqual(activeMocks, ["example"]);
  });

  test("when multiple mocks are created", () => {
    const content = "_mock.create example1\n_mock.create example2\n";
    const document = createMockDocument(content);
    const position = new vscode.Position(2, 0);
    const activeMocks = getActiveMocks(document, position);
    assert.deepStrictEqual(activeMocks, ["example1", "example2"]);
  });

  test("when a mock is deleted", () => {
    const content = "_mock.create example\n_mock.delete example\n";
    const document = createMockDocument(content);
    const position = new vscode.Position(2, 0);
    const activeMocks = getActiveMocks(document, position);
    assert.strictEqual(activeMocks.length, 0);
  });

  test("when mocks are created and deleted selectively", () => {
    const content =
      "_mock.create example1\n_mock.create example2\n_mock.delete example1\n";
    const document = createMockDocument(content);
    const position = new vscode.Position(3, 0);
    const activeMocks = getActiveMocks(document, position);
    assert.deepStrictEqual(activeMocks, ["example2"]);
  });

  test("when checking before mock creation", () => {
    const content = "echo hello\n_mock.create example\n";
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 10);
    const activeMocks = getActiveMocks(document, position);
    assert.strictEqual(activeMocks.length, 0);
  });

  test("when checking between creation and deletion", () => {
    const content = "_mock.create example\n\n_mock.delete example\n";
    const document = createMockDocument(content);
    const position = new vscode.Position(1, 0);
    const activeMocks = getActiveMocks(document, position);
    assert.deepStrictEqual(activeMocks, ["example"]);
  });

  test("when mock creation is commented out", () => {
    const content = "# _mock.create example\n";
    const document = createMockDocument(content);
    const position = new vscode.Position(1, 0);
    const activeMocks = getActiveMocks(document, position);
    assert.strictEqual(activeMocks.length, 0);
  });

  test("when mock creation has a trailing comment", () => {
    const content = "_mock.create example # this is a comment\n";
    const document = createMockDocument(content);
    const position = new vscode.Position(1, 0);
    const activeMocks = getActiveMocks(document, position);
    assert.deepStrictEqual(activeMocks, ["example"]);
  });
});
