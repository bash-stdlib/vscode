import * as sinon from "sinon";
import * as vscode from "vscode";
import * as assert from "assert";
import { runLinter, linterProcess } from "@/shell/linter";

suite("when the linter is executed", () => {
  let execStub: sinon.SinonStub;

  setup(() => {
    execStub = sinon.stub(linterProcess, "exec");

    execStub.callsFake(async (command: string) => {
      if (!command.startsWith('"python3"')) {
        throw new Error(
          `Expected command to start with pythonPath, but got: ${command}`,
        );
      }
      if (command.includes("success.sh")) {
        return { stdout: "[]", stderr: "" };
      } else if (
        command.includes("error.sh") &&
        !command.includes("error2.sh")
      ) {
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
            file: "error.sh",
          },
        ]);
        return { stdout: output, stderr: "" };
      } else if (
        command.includes("error.sh") &&
        command.includes("error2.sh")
      ) {
        const output = JSON.stringify([
          {
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 5 },
            },
            severity: 1,
            code: "STD001",
            source: "bash-stdlib-lint",
            message: "Error in file 1",
            file: "error.sh",
          },
          {
            range: {
              start: { line: 1, character: 0 },
              end: { line: 1, character: 5 },
            },
            severity: 1,
            code: "STD002",
            source: "bash-stdlib-lint",
            message: "Error in file 2",
            file: "error2.sh",
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
        "message": "Mixed output error",
        "file": "mixed_output.sh"
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
    const results = await runLinter("linter.py", ["success.sh"], "python3");
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].diagnostics.length, 0);
  });

  test("then it should parse errors correctly", async () => {
    const results = await runLinter("linter.py", ["error.sh"], "python3");
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
  });

  test("then it should include white listed namespaces before paths in the command with -a", async () => {
    await runLinter("linter.py", ["success.sh"], "python3", ["extra", "ns"]);

    const lastCall = execStub.lastCall;
    const command = lastCall.args[0];
    assert.ok(command.includes('-a "extra" "ns" "success.sh"'));
  });

  test("then it should handle multiple files", async () => {
    const results = await runLinter(
      "linter.py",
      ["error.sh", "error2.sh"],
      "python3",
    );
    assert.strictEqual(results.length, 2);

    const res1 = results.find((r) => r.filePath === "error.sh");
    const res2 = results.find((r) => r.filePath === "error2.sh");

    assert.ok(res1);
    assert.ok(res2);
    assert.strictEqual(res1!.diagnostics.length, 1);
    assert.strictEqual(res1!.diagnostics[0].message, "Error in file 1");
    assert.strictEqual(res2!.diagnostics.length, 1);
    assert.strictEqual(res2!.diagnostics[0].message, "Error in file 2");
  });

  test("then it should handle mixed output with extra text", async () => {
    const results = await runLinter(
      "linter.py",
      ["mixed_output.sh"],
      "python3",
    );
    assert.strictEqual(results.length, 1);
    const diagnostics = results[0].diagnostics;
    assert.strictEqual(diagnostics.length, 1);
    assert.strictEqual(diagnostics[0].message, "Mixed output error");
    assert.strictEqual(diagnostics[0].range.start.line, 1);
  });
});
