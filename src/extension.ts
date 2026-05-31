import * as vscode from "vscode";
import { ShdocFunction } from "@/shell/shdoc";
import { DocumentationFetcher } from "@/shell/fetcher";
import { HtmlDocumentationParser } from "@/shell/htmlParser";

export async function activate(context: vscode.ExtensionContext) {
  let functions: ShdocFunction[] = [];

  const config = vscode.workspace.getConfiguration("bash-stdlib");
  const language = config.get<string>("documentationLanguage") || "en";

  try {
    const fetcher = new DocumentationFetcher();
    const urls = fetcher.getUrls(language);

    const [normalHtml, testingHtml] = await Promise.all([
      fetcher.fetch(urls.normal).catch(() => ""),
      fetcher.fetch(urls.testing).catch(() => ""),
    ]);

    const parser = new HtmlDocumentationParser();
    functions = [...parser.parse(normalHtml), ...parser.parse(testingHtml)];
  } catch (error) {
    console.error("Failed to load or parse documentation:", error);
  }

  const completionProvider = vscode.languages.registerCompletionItemProvider(
    "shellscript",
    {
      provideCompletionItems(document, position) {
        return functions.map((parsedFunction) => {
          const completionItem = new vscode.CompletionItem(
            parsedFunction.name,
            vscode.CompletionItemKind.Function,
          );

          // 1. Signature Details
          const argSignature = parsedFunction.args.map((a) => a.name).join(" ");
          completionItem.detail =
            `${parsedFunction.name} ${argSignature}`.trim();

          // 2. Build Markdown Documentation Tooltip
          completionItem.documentation = createMarkdownDocumentation(parsedFunction);

          // 3. Smart Code Snippet insertion
          if (parsedFunction.args && parsedFunction.args.length > 0) {
            const snippetArgs = parsedFunction.args
              .map((arg, index) => {
                return `\${${index + 1}:${arg.name}}`;
              })
              .join(" ");
            completionItem.insertText = new vscode.SnippetString(
              `${parsedFunction.name} ${snippetArgs}`,
            );
          } else {
            completionItem.insertText = parsedFunction.name;
          }

          return completionItem;
        });
      },
    },
  );

  const hoverProvider = vscode.languages.registerHoverProvider(
    "shellscript",
    {
      provideHover(document, position) {
        const range = document.getWordRangeAtPosition(position, /[\w.]+/);
        if (!range) {
          return null;
        }
        const word = document.getText(range);

        const foundFunction = functions.find((f) => f.name === word);
        if (foundFunction) {
          return new vscode.Hover(createMarkdownDocumentation(foundFunction));
        }

        return null;
      },
    }
  );

  context.subscriptions.push(completionProvider, hoverProvider);
}

function createMarkdownDocumentation(parsedFunction: ShdocFunction): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString();

  // Description
  markdown.appendMarkdown(
    `**Description:**\n${parsedFunction.description}\n\n`,
  );

  // Arguments (if any)
  if (parsedFunction.args && parsedFunction.args.length > 0) {
    markdown.appendMarkdown(`**Arguments:**\n`);
    parsedFunction.args.forEach((arg) => {
      markdown.appendMarkdown(
        `* \`${arg.name}\` _(${arg.type})_ - ${arg.desc}\n`,
      );
    });
    markdown.appendMarkdown(`\n`);
  }

  // Options (if any)
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

  return markdown;
}

export function deactivate() {}
