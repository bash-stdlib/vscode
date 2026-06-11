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

  suite("when no mocks are created", () => {
    let activeMocks: string[];

    setup(() => {
      const content = "echo hello";
      const document = createMockDocument(content);
      const position = new vscode.Position(0, 10);
      activeMocks = getActiveMocks(document, position);
    });

    test("then it should return an empty array", () => {
      assert.strictEqual(activeMocks.length, 0);
    });
  });

  suite("when a mock is created", () => {
    let activeMocks: string[];

    setup(() => {
      const content = "_mock.create example\n";
      const document = createMockDocument(content);
      const position = new vscode.Position(1, 0);
      activeMocks = getActiveMocks(document, position);
    });

    test("then it should return the mock name", () => {
      assert.deepStrictEqual(activeMocks, ["example"]);
    });
  });

  suite("when multiple mocks are created", () => {
    let activeMocks: string[];

    setup(() => {
      const content = "_mock.create example1\n_mock.create example2\n";
      const document = createMockDocument(content);
      const position = new vscode.Position(2, 0);
      activeMocks = getActiveMocks(document, position);
    });

    test("then it should return all mock names", () => {
      assert.deepStrictEqual(activeMocks, ["example1", "example2"]);
    });
  });

  suite("when a mock is deleted", () => {
    let activeMocks: string[];

    setup(() => {
      const content = "_mock.create example\n_mock.delete example\n";
      const document = createMockDocument(content);
      const position = new vscode.Position(2, 0);
      activeMocks = getActiveMocks(document, position);
    });

    test("then it should return an empty array", () => {
      assert.strictEqual(activeMocks.length, 0);
    });
  });

  suite("when mocks are created and deleted selectively", () => {
    let activeMocks: string[];

    setup(() => {
      const content =
        "_mock.create example1\n_mock.create example2\n_mock.delete example1\n";
      const document = createMockDocument(content);
      const position = new vscode.Position(3, 0);
      activeMocks = getActiveMocks(document, position);
    });

    test("then it should return only the active mock names", () => {
      assert.deepStrictEqual(activeMocks, ["example2"]);
    });
  });

  suite("when checking before mock creation", () => {
    let activeMocks: string[];

    setup(() => {
      const content = "echo hello\n_mock.create example\n";
      const document = createMockDocument(content);
      const position = new vscode.Position(0, 10);
      activeMocks = getActiveMocks(document, position);
    });

    test("then it should return an empty array", () => {
      assert.strictEqual(activeMocks.length, 0);
    });
  });

  suite("when checking between creation and deletion", () => {
    let activeMocks: string[];

    setup(() => {
      const content = "_mock.create example\n\n_mock.delete example\n";
      const document = createMockDocument(content);
      const position = new vscode.Position(1, 0);
      activeMocks = getActiveMocks(document, position);
    });

    test("then it should return the active mock name", () => {
      assert.deepStrictEqual(activeMocks, ["example"]);
    });
  });

  suite("when mock creation is commented out", () => {
    let activeMocks: string[];

    setup(() => {
      const content = "# _mock.create example\n";
      const document = createMockDocument(content);
      const position = new vscode.Position(1, 0);
      activeMocks = getActiveMocks(document, position);
    });

    test("then it should return an empty array", () => {
      assert.strictEqual(activeMocks.length, 0);
    });
  });

  suite("when mock creation has a trailing comment", () => {
    let activeMocks: string[];

    setup(() => {
      const content = "_mock.create example # this is a comment\n";
      const document = createMockDocument(content);
      const position = new vscode.Position(1, 0);
      activeMocks = getActiveMocks(document, position);
    });

    test("then it should return the mock name", () => {
      assert.deepStrictEqual(activeMocks, ["example"]);
    });
  });
});
