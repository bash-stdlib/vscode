import * as sinon from "sinon";
import * as vscode from "vscode";
import * as assert from "assert";
import { runLinter, linterProcess } from "@/shell/linter";

suite("when the linter is executed", () => {
  let execStub: sinon.SinonStub;

  setup(() => {
    execStub = sinon.stub(linterProcess, "exec");

    execStub.callsFake(async (command: string) => {
      if (command.includes("success.sh")) {
        return { stdout: "[]", stderr: "" };
      } else if (command.includes("error.sh")) {
        const output = JSON.stringify([
          {
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 5 },
            },
            severity: 1,
            code: "STD001",
            source: "bash-stdlib-lint",
            message: "Test error message",
          },
        ]);
        return { stdout: output, stderr: "" };
      } else if (command.includes("mixed_output.sh")) {
        const output = `
 Fetching documentation to build cache...
[
    {
        "range": {
            "start": { "line": 1, "character": 2 },
            "end": { "line": 1, "character": 10 }
        },
        "severity": 1,
        "code": "STD002",
        "source": "bash-stdlib-lint",
        "message": "Mixed output error"
    }
]
Cache saved to .bash_stdlib_cache.json
`;
        return { stdout: output, stderr: "" };
      }
      return { stdout: "", stderr: "" };
    });
  });

  teardown(() => {
    execStub.restore();
  });

  test("then it should return an empty array for no errors", async () => {
    const results = await runLinter("linter.py", ["success.sh"]);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].diagnostics.length, 0);
  });

  test("then it should parse errors correctly", async () => {
    const results = await runLinter("linter.py", ["error.sh"]);
    assert.strictEqual(results.length, 1);
    const diagnostics = results[0].diagnostics;
    assert.strictEqual(diagnostics.length, 1);
    assert.strictEqual(diagnostics[0].message, "Test error message");
    assert.strictEqual(diagnostics[0].code, "STD001");
    assert.strictEqual(
      diagnostics[0].severity,
      vscode.DiagnosticSeverity.Error,
    );
    assert.strictEqual(diagnostics[0].range.start.line, 0);
    assert.strictEqual(diagnostics[0].range.start.character, 0);
    assert.strictEqual(diagnostics[0].range.end.line, 0);
    assert.strictEqual(diagnostics[0].range.end.character, 5);
  });

  test("then it should handle mixed output with extra text", async () => {
    const results = await runLinter("linter.py", ["mixed_output.sh"]);
    assert.strictEqual(results.length, 1);
    const diagnostics = results[0].diagnostics;
    assert.strictEqual(diagnostics.length, 1);
    assert.strictEqual(diagnostics[0].message, "Mixed output error");
    assert.strictEqual(diagnostics[0].range.start.line, 1);
  });
});
