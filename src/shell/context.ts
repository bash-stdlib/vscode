import * as vscode from "vscode";
import { ShdocFunction } from "@/shell/shdoc";

export function isTestContext(document: vscode.TextDocument): boolean {
  const lowercasePath = document.uri.path.toLowerCase();
  return lowercasePath.includes("test");
}

export function getFunctionsForContext(
  allFunctions: ShdocFunction[],
  document: vscode.TextDocument,
): ShdocFunction[] {
  if (isTestContext(document)) {
    return allFunctions;
  }

  return allFunctions.filter((fn) => !fn.isTesting);
}
