import * as vscode from "vscode";

export function extractShellFunctions(documentText: string): string[] {
  const functions: string[] = [];

  console.log(documentText);

  // Matches 'function name', 'name()', or 'function name()'
  const functionRegex = /^(stdlib\.[a-z0-9_\.]*)\s*\(\s*\)/gm;

  let match;
  while ((match = functionRegex.exec(documentText)) !== null) {
    // Group 1 matches 'name()' style, Group 2 matches 'function name' style
    const funcName = match[1] || match[2];
    if (funcName && !functions.includes(funcName)) {
      functions.push(funcName);
    }
  }

  return functions;
}
