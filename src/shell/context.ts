import * as vscode from "vscode";
import {
  getActiveMocks,
  generateMockFunctions,
} from "@/providers/completion/mocks";
import { ShdocFunction } from "@/shell/shdoc";

export function isTestContext(document: vscode.TextDocument): boolean {
  const lowercasePath = document.uri.path.toLowerCase();
  return lowercasePath.includes("test");
}

export function getFunctionsForContext(
  allFunctions: ShdocFunction[],
  mockTemplates: ShdocFunction[],
  document: vscode.TextDocument,
  position?: vscode.Position,
): ShdocFunction[] {
  if (isTestContext(document)) {
    const functions = [...allFunctions];

    if (position) {
      const activeMocks = getActiveMocks(document, position);
      activeMocks.forEach((mockName) => {
        functions.push(...generateMockFunctions(mockTemplates, mockName));
      });
    }

    return functions;
  }

  return allFunctions.filter((fn) => !fn.isTesting);
}
