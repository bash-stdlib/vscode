import * as vscode from "vscode";

export async function clearDocument(document: vscode.TextDocument) {
  const edit = new vscode.WorkspaceEdit();
  edit.delete(document.uri, new vscode.Range(0, 0, document.lineCount, 0));
  await vscode.workspace.applyEdit(edit);
}

export async function getCompletionsAt(
  document: vscode.TextDocument,
  line: number,
  character: number,
) {
  return await vscode.commands.executeCommand<vscode.CompletionList>(
    "vscode.executeCompletionItemProvider",
    document.uri,
    new vscode.Position(line, character),
  );
}

export async function insertText(document: vscode.TextDocument, text: string) {
  const edit = new vscode.WorkspaceEdit();
  edit.insert(document.uri, new vscode.Position(0, 0), text);
  await vscode.workspace.applyEdit(edit);
}
