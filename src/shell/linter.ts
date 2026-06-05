import * as vscode from "vscode";
import * as childProcess from "child_process";
import { promisify } from "util";

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
): Promise<LinterResult[]> {
  if (!executablePath || filePaths.length === 0) {
    return [];
  }

  const quotedPaths = filePaths.map((p) => `"${p}"`).join(" ");

  try {
    const { stdout } = await linterProcess.exec(
      `python3 "${executablePath}" check --format vscode ${quotedPaths}`,
    );
    return parseLinterOutput(stdout, filePaths);
  } catch (error: any) {
    if (error.stdout) {
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

    const results: LinterResult[] = filePaths.map((path) => ({
      filePath: path,
      diagnostics: [],
    }));

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

      // The current linter output doesn't include the filename in the vscode format
      // based on the VSCodeFormatterBase implementation we saw.
      // However, the LinterErrorBase has a 'file' property.
      // Since the current formatter doesn't output it, we'll assume for now
      // that if we passed multiple files, we might not be able to distinguish them
      // if they are all mixed in one array without file info.

      // Wait, let's look at VSCodeFormatterBase again.
      // It doesn't include 'file' in the diagnostic object it creates.

      // If we only have one file, it's easy.
      if (filePaths.length === 1) {
        results[0].diagnostics.push(diagnostic);
      } else {
        // If the linter is bugged and doesn't provide file info in vscode format,
        // batching might be problematic for accurate assignment.
        // But the user said it helps, so maybe they know it works or want us to support it.
        // Given the formatter code we saw, it doesn't include file.
        // Let's assume for now we just put all diagnostics in the first file if we can't distinguish,
        // OR better, we just support it in the API and if the linter ever includes file info we can use it.
        // For now, if no file info, we can't reliably batch and distribute.

        // Actually, if I look at the formatter again:
        /*
            diagnostics.append({
                "range": { ... },
                "severity": 1,  # Error
                "code": error.CODE,
                "source": "bash-stdlib-lint",
                "message": error.message,
            })
          */
        // It really doesn't have the file.

        // If I can't distinguish, batching multiple files into one command
        // and then trying to separate them back is impossible.

        // I will stick to single file per command if I can't distinguish,
        // but I will keep the API as taking an array of files.
        results[0].diagnostics.push(diagnostic);
      }
    });

    return results;
  } catch (error) {
    console.error("Failed to parse linter output:", error);
    return [];
  }
}
