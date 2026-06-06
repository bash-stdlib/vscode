import * as vscode from "vscode";
import { ShdocFunction } from "@/shell/shdoc";

export function isTestContext(document: vscode.TextDocument): boolean {
  const lowercasePath = document.uri.path.toLowerCase();
  return lowercasePath.includes("test");
}

export function getActiveMocks(
  document: vscode.TextDocument,
  position: vscode.Position,
): string[] {
  const mocks = new Set<string>();

  for (let i = 0; i <= position.line; i++) {
    let lineText = document.lineAt(i).text;
    if (i === position.line) {
      lineText = lineText.substring(0, position.character);
    }

    const commentIndex = lineText.indexOf("#");
    if (commentIndex !== -1) {
      lineText = lineText.substring(0, commentIndex);
    }

    const createRegex = /_mock\.create\s+([@\w.]+)/g;
    const deleteRegex = /_mock\.delete\s+([@\w.]+)/g;

    let match;
    while ((match = createRegex.exec(lineText)) !== null) {
      mocks.add(match[1]);
    }

    while ((match = deleteRegex.exec(lineText)) !== null) {
      mocks.delete(match[1]);
    }
  }

  return Array.from(mocks);
}

export function generateMockFunctions(
  templates: ShdocFunction[],
  mockName: string,
): ShdocFunction[] {
  return templates.map((template) => {
    const name = template.name === "object" ? mockName : template.name;
    const namespace = template.namespace
      ? template.namespace.replace(/^object/, mockName)
      : template.namespace;

    return {
      ...template,
      name,
      namespace,
      description: template.description.replace(/object/g, mockName),
      args: template.args.map((arg) => ({
        ...arg,
        desc: arg.desc.replace(/object/g, mockName),
      })),
      keywords: template.keywords.map((kw) => ({
        ...kw,
        name: kw.name.replace(/object/g, mockName),
        desc: kw.desc.replace(/object/g, mockName),
      })),
      globals: template.globals.map((gl) => ({
        ...gl,
        name: gl.name.replace(/object/g, mockName),
        desc: gl.desc.replace(/object/g, mockName),
      })),
    };
  });
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
