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
  whiteListedNamespaces: string[] = [],
  ignoredCodes: string[] = [],
): Promise<LinterResult[]> {
  if (!executablePath || filePaths.length === 0) {
    return [];
  }

  const quotedPaths = filePaths.map((p) => `"${p}"`).join(" ");
  let command = `"${pythonPath}" "${executablePath}" check --format vscode`;

  whiteListedNamespaces.forEach((ns) => {
    command += ` -a "${ns}"`;
  });

  ignoredCodes.forEach((code) => {
    command += ` -i "${code}"`;
  });

  command += ` ${quotedPaths}`;

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

const SUPPRESSED_SC2034_VARS = [
  "parametrize_configuration",
  "parametrize_configuration_index",
  "parametrize_configuration_line",
  "parametrize_configuration_scenario_start_index",
  "test_function_variant_name",
  "test_function_variant_padding_value",
  "PARAMETRIZE_SCENARIO_NAME",
  "setting_debug_boolean",
  "setting_field_separator_char",
  "setting_fixture_command_prefix",
  "setting_original_test_names_boolean",
  "setting_variant_tag",
];

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
    const rawData = JSON.parse(jsonStr);
    const diagnosticsData = Array.isArray(rawData) ? rawData : rawData.comments;

    if (!Array.isArray(diagnosticsData)) {
      return [];
    }

    const resultsMap = new Map<string, vscode.Diagnostic[]>();
    filePaths.forEach((path) => resultsMap.set(path, []));

    diagnosticsData.forEach((data: any) => {
      if (data.code === 2034 || data.code === "SC2034") {
        const isSuppressed = SUPPRESSED_SC2034_VARS.some((v) =>
          data.message.includes(v),
        );
        if (isSuppressed) {
          return;
        }
      }

      let range: vscode.Range;
      if (data.range) {
        range = new vscode.Range(
          data.range.start.line,
          data.range.start.character,
          data.range.end.line,
          data.range.end.character,
        );
      } else {
        const line = (data.line ?? 1) - 1;
        const column = (data.column ?? 1) - 1;
        const endLine = (data.endLine ?? data.line ?? 1) - 1;
        const endColumn = (data.endColumn ?? data.column ?? 1) - 1;
        range = new vscode.Range(line, column, endLine, endColumn);
      }

      const diagnostic = new vscode.Diagnostic(
        range,
        data.message,
        data.severity === 1 || data.level === "error"
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
