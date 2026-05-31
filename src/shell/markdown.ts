import * as vscode from "vscode";
import { ShdocFunction } from "@/shell/shdoc";

export function createMarkdownDocumentation(parsedFunction: ShdocFunction): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString();

  markdown.appendMarkdown(`**Description:**\n${parsedFunction.description}\n\n`);

  if (parsedFunction.args && parsedFunction.args.length > 0) {
    markdown.appendMarkdown(`**Arguments:**\n`);
    parsedFunction.args.forEach((arg) => {
      markdown.appendMarkdown(`* \`${arg.name}\` _(${arg.type})_ - ${arg.desc}\n`);
    });
    markdown.appendMarkdown(`\n`);
  }

  if (parsedFunction.options && parsedFunction.options.length > 0) {
    markdown.appendMarkdown(`**Options:**\n`);
    parsedFunction.options.forEach((opt) => {
      markdown.appendMarkdown(`* \`${opt.flags}\` - ${opt.desc}\n`);
    });
    markdown.appendMarkdown(`\n`);
  }

  if (parsedFunction.exitcodes && parsedFunction.exitcodes.length > 0) {
    markdown.appendMarkdown(`**Exit Codes:**\n`);
    parsedFunction.exitcodes.forEach((ec) => {
      markdown.appendMarkdown(`* \`${ec.code}\` - ${ec.desc}\n`);
    });
  }

  return markdown;
}
