import * as vscode from "vscode";
import * as childProcess from "child_process";
import { promisify } from "util";

export const linterProcess = {
  exec: promisify(childProcess.exec),
};

export async function runLinter(
  executablePath: string,
  filePath: string,
): Promise<vscode.Diagnostic[]> {
  if (!executablePath) {
    return [];
  }

  try {
    const { stdout } = await linterProcess.exec(
      `python3 "${executablePath}" check --format vscode "${filePath}"`,
    );
    return parseLinterOutput(stdout);
  } catch (error: any) {
    // The linter might exit with a non-zero code if it finds errors.
    // We should still try to parse stdout if it exists.
    if (error.stdout) {
      return parseLinterOutput(error.stdout);
    }
    console.error("Linter execution failed:", error);
    return [];
  }
}

function parseLinterOutput(output: string): vscode.Diagnostic[] {
  try {
    // Find the first '[' and last ']' to extract the JSON array,
    // as there might be other output (like cache messages)
    const startIndex = output.indexOf("[");
    const endIndex = output.lastIndexOf("]");

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      return [];
    }

    const jsonStr = output.substring(startIndex, endIndex + 1);
    const diagnosticsData = JSON.parse(jsonStr);

    return diagnosticsData.map((data: any) => {
      const range = new vscode.Range(
        data.range.start.line,
        data.range.start.character,
        data.range.end.line,
        data.range.end.character,
      );

      const diagnostic = new vscode.Diagnostic(
        range,
        data.message,
        data.severity === 1
          ? vscode.DiagnosticSeverity.Error
          : vscode.DiagnosticSeverity.Warning,
      );
      diagnostic.code = data.code;
      diagnostic.source = data.source;
      return diagnostic;
    });
  } catch (error) {
    console.error("Failed to parse linter output:", error);
    return [];
  }
}
