import * as sinon from "sinon";
import * as vscode from "vscode";
import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { runLinter, linterProcess, LinterResult } from "@/shell/linter";

suite("when the linter is executed", () => {
  let execStub: sinon.SinonStub;
  let responses: { pattern: string[]; stdout: any; stderr: string }[];

  setup(() => {
    const assetsPath = path.join(__dirname, "assets/linter-responses.json");
    responses = JSON.parse(fs.readFileSync(assetsPath, "utf8"));

    execStub = sinon.stub(linterProcess, "exec");

    execStub.callsFake(async (command: string) => {
      if (!command.startsWith('"python3"')) {
        throw new Error(
          `Expected command to start with pythonPath, but got: ${command}`,
        );
      }

      const matchedResponse = responses.find((r) =>
        r.pattern.every((p) => command.includes(p)),
      );

      if (matchedResponse) {
        return {
          stdout:
            typeof matchedResponse.stdout === "string"
              ? matchedResponse.stdout
              : JSON.stringify(matchedResponse.stdout),
          stderr: matchedResponse.stderr,
        };
      }

      return { stdout: "", stderr: "" };
    });
  });

  teardown(() => {
    execStub.restore();
  });

  suite("given no errors are returned", () => {
    let results: LinterResult[];

    setup(async () => {
      results = await runLinter("linter.py", ["success.sh"], "python3");
    });

    test("then it should return results for one file", () => {
      assert.strictEqual(results.length, 1);
    });

    test("then it should return an empty array of diagnostics", () => {
      assert.strictEqual(results[0].diagnostics.length, 0);
    });
  });

  suite("given errors are returned", () => {
    let results: LinterResult[];

    setup(async () => {
      results = await runLinter("linter.py", ["error.sh"], "python3");
    });

    test("then it should return results for one file", () => {
      assert.strictEqual(results.length, 1);
    });

    test("then it should parse the error message correctly", () => {
      assert.strictEqual(
        results[0].diagnostics[0].message,
        "Test error message",
      );
    });

    test("then it should parse the error code correctly", () => {
      assert.strictEqual(results[0].diagnostics[0].code, "STD001");
    });

    test("then it should parse the severity correctly", () => {
      assert.strictEqual(
        results[0].diagnostics[0].severity,
        vscode.DiagnosticSeverity.Error,
      );
    });

    test("then it should parse the line number correctly", () => {
      assert.strictEqual(results[0].diagnostics[0].range.start.line, 0);
    });
  });

  suite("given multiple namespaces", () => {
    let command: string;

    setup(async () => {
      await runLinter("linter.py", ["success.sh"], "python3", ["ns1", "ns2"]);
      command = execStub.lastCall.args[0];
    });

    test("then it should include both namespaces with -ns flags", () => {
      assert.ok(command.includes('-ns "ns1" -ns "ns2" "success.sh"'));
    });
  });

  suite("given multiple functions", () => {
    let command: string;

    setup(async () => {
      await runLinter(
        "linter.py",
        ["success.sh"],
        "python3",
        [],
        ["func1", "func2"],
      );
      command = execStub.lastCall.args[0];
    });

    test("then it should include both functions with -fn flags", () => {
      assert.ok(command.includes('-fn "func1" -fn "func2" "success.sh"'));
    });
  });

  suite("given extra namespaces, functions and ignored codes", () => {
    let command: string;

    setup(async () => {
      await runLinter(
        "linter.py",
        ["success.sh"],
        "python3",
        ["extra", "ns"],
        ["func1", "func2"],
        ["SC1090", "SC2034"],
      );
      command = execStub.lastCall.args[0];
    });

    test("then it should include all flags in the command", () => {
      assert.ok(
        command.includes(
          '-ns "extra" -ns "ns" -fn "func1" -fn "func2" -i "SC1090" -i "SC2034" "success.sh"',
        ),
      );
    });
  });

  suite("given multiple files", () => {
    let results: LinterResult[];
    let resultsMap: Map<string, LinterResult>;

    setup(async () => {
      results = await runLinter(
        "linter.py",
        ["error.sh", "error2.sh"],
        "python3",
      );
      resultsMap = new Map(results.map((r) => [r.filePath, r]));
    });

    test("then it should return results for all files", () => {
      assert.strictEqual(results.length, 2);
    });

    test("then it should contain diagnostics for the first file", () => {
      const result = resultsMap.get("error.sh");
      assert.ok(result);
      assert.strictEqual(result!.diagnostics.length, 1);
      assert.strictEqual(result!.diagnostics[0].message, "Error in file 1");
    });

    test("then it should contain diagnostics for the second file", () => {
      const result = resultsMap.get("error2.sh");
      assert.ok(result);
      assert.strictEqual(result!.diagnostics.length, 1);
      assert.strictEqual(result!.diagnostics[0].message, "Error in file 2");
    });
  });

  suite("given mixed output with extra text", () => {
    let results: LinterResult[];

    setup(async () => {
      results = await runLinter("linter.py", ["mixed_output.sh"], "python3");
    });

    test("then it should return results for one file", () => {
      assert.strictEqual(results.length, 1);
    });

    test("then it should parse the diagnostic message correctly", () => {
      assert.strictEqual(
        results[0].diagnostics[0].message,
        "Mixed output error",
      );
    });

    test("then it should parse the line number correctly", () => {
      assert.strictEqual(results[0].diagnostics[0].range.start.line, 1);
    });
  });
});
