import * as vscode from "vscode";
import { ShdocFunction } from "./shdoc";
import { debug } from "@/debug";

export function createHoverProvider(
  allFunctions: ShdocFunction[],
): vscode.HoverProvider {
  return {
    provideHover(document, position) {
      const isTestFile = document.fileName.toLowerCase().includes("test");
      const functionsAvailableInContext = isTestFile
        ? allFunctions
        : allFunctions.filter((fn) => !fn.isTesting);

      const word = document.getWordRangeAtPosition(position);
      if (!word) {
        return null;
      }

      const text = document.getText(word);
      const lineText = document.lineAt(position.line).text;

      const fullIdentifier = extractFullIdentifier(
        lineText,
        position.character,
      );

      debug(
        `Hover requested for: "${fullIdentifier}" in ${isTestFile ? "test" : "normal"} file`,
      );

      const foundFunction = findFunction(functionsAvailableInContext, fullIdentifier);

      if (!foundFunction) {
        return null;
      }

      const hover = new vscode.Hover(
        buildHoverDocumentation(foundFunction),
        word,
      );

      return hover;
    },
  };
}

/**
 * Extract full identifier from line text at character position.
 * E.g., from "stdlib.array.assert.is_empty" returns the full chain.
 */
export function extractFullIdentifier(
  lineText: string,
  charPos: number,
): string {
  // Start from charPos and expand left and right to find the full identifier
  let start = charPos;
  let end = charPos;

  // Expand left
  while (start > 0 && /[\w.]/.test(lineText[start - 1])) {
    start--;
  }

  // Expand right
  while (end < lineText.length && /[\w.]/.test(lineText[end])) {
    end++;
  }

  return lineText.substring(start, end);
}

/**
 * Find a function in the functions array by its full name.
 * Supports both "stdlib.array.is_empty" and "is_empty" formats.
 */
export function findFunction(
  functions: ShdocFunction[],
  identifier: string,
): ShdocFunction | null {
  // Direct match: fully qualified name like "stdlib.array.is_empty"
  for (const fn of functions) {
    const fullName = fn.namespace ? `${fn.namespace}.${fn.name}` : fn.name;
    if (fullName === identifier) {
      return fn;
    }
  }

  // Partial match: just function name
  const lastPart = identifier.split(".").pop();
  if (lastPart) {
    for (const fn of functions) {
      if (fn.name === lastPart) {
        return fn;
      }
    }
  }

  return null;
}

function buildHoverDocumentation(
  parsedFunction: ShdocFunction,
): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString();
  markdown.isTrusted = true;

  const displayName = parsedFunction.namespace
    ? `${parsedFunction.namespace}.${parsedFunction.name}`
    : parsedFunction.name;

  // Header
  markdown.appendMarkdown(`### ${displayName}\n\n`);

  // Description
  markdown.appendMarkdown(`${parsedFunction.description}\n\n`);

  // Arguments
  if (parsedFunction.args && parsedFunction.args.length > 0) {
    markdown.appendMarkdown(`**Arguments:**\n`);
    parsedFunction.args.forEach((arg) => {
      markdown.appendMarkdown(
        `* \`${arg.name}\` _(${arg.type})_ - ${arg.desc}\n`,
      );
    });
    markdown.appendMarkdown(`\n`);
  }

  // Options
  if (parsedFunction.options && parsedFunction.options.length > 0) {
    markdown.appendMarkdown(`**Options:**\n`);
    parsedFunction.options.forEach((opt) => {
      markdown.appendMarkdown(`* \`${opt.flags}\` - ${opt.desc}\n`);
    });
    markdown.appendMarkdown(`\n`);
  }

  // Exit Codes
  if (parsedFunction.exitcodes && parsedFunction.exitcodes.length > 0) {
    markdown.appendMarkdown(`**Exit Codes:**\n`);
    parsedFunction.exitcodes.forEach((ec) => {
      markdown.appendMarkdown(`* \`${ec.code}\` - ${ec.desc}\n`);
    });
  }

  debug(
    `Hover documentation for ${displayName} length: ${markdown.value.length}`,
  );

  return markdown;
}
