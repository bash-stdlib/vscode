import * as vscode from "vscode";
import * as childProcess from "child_process";
import { promisify } from "util";
import { debug } from "@/debug";

export const linterProcess = {
  exec: promisify(childProcess.exec),
};

export interface LinterResult {
  filePath: string;
  diagnostics: vscode.Diagnostic[];
}

export async function runLinter(
  executablePath: string,
  filePaths: string[],
  pythonPath: string = "python3",
  extraNamespaces: string[] = [],
): Promise<LinterResult[]> {
  if (!executablePath || filePaths.length === 0) {
    return [];
  }

  const quotedPaths = filePaths.map((p) => `"${p}"`).join(" ");
  let command = `"${pythonPath}" "${executablePath}" check --format vscode ${quotedPaths}`;

  if (extraNamespaces.length > 0) {
    const quotedNamespaces = extraNamespaces.map((ns) => `"${ns}"`).join(" ");
    command += ` -a ${quotedNamespaces}`;
  }

  debug(`Running linter command: ${command}`);

  try {
    const { stdout } = await linterProcess.exec(command);
    debug(`Linter output: ${stdout}`);
    return parseLinterOutput(stdout, filePaths);
  } catch (error: any) {
    debug(`Linter failed with error: ${error.message}`);
    if (error.stdout) {
      debug(`Linter partial output: ${error.stdout}`);
      return parseLinterOutput(error.stdout, filePaths);
    }
    console.error("Linter execution failed:", error);
    return [];
  }
}

function parseLinterOutput(
  output: string,
  filePaths: string[],
): LinterResult[] {
  try {
    const startIndex = output.indexOf("[");
    const endIndex = output.lastIndexOf("]");

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      return [];
    }

    const jsonStr = output.substring(startIndex, endIndex + 1);
    const diagnosticsData = JSON.parse(jsonStr);

    const resultsMap = new Map<string, vscode.Diagnostic[]>();
    filePaths.forEach((path) => resultsMap.set(path, []));

    diagnosticsData.forEach((data: any) => {
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

      const filePath = data.file;
      if (filePath && resultsMap.has(filePath)) {
        resultsMap.get(filePath)!.push(diagnostic);
      } else if (filePaths.length === 1) {
        resultsMap.get(filePaths[0])!.push(diagnostic);
      }
    });

    return Array.from(resultsMap.entries()).map(([filePath, diagnostics]) => ({
      filePath,
      diagnostics,
    }));
  } catch (error) {
    console.error("Failed to parse linter output:", error);
    return [];
  }
}
