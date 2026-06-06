import * as vscode from "vscode";
import { debug } from "@/debug";
import { DocumentationFetcher } from "@/shell/html/fetcher";
import { HtmlDocumentationParser } from "@/shell/html/htmlParser";
import { BashStdlibFunctions } from "@/shell/shdoc";

export async function loadFunctions(): Promise<BashStdlibFunctions> {
  const config = vscode.workspace.getConfiguration("bash-stdlib");
  const language = config.get<string>("documentationLanguage") || "en";

  try {
    const fetcher = new DocumentationFetcher();
    const urls = fetcher.getUrls(language);

    const [normalHtml, testingHtml, mockTemplatesHtml] = await Promise.all([
      fetcher.fetch(urls.normal),
      fetcher.fetch(urls.testing),
      fetcher.fetch(urls.mockTemplates),
    ]);

    const parser = new HtmlDocumentationParser();
    const allFunctions = [
      ...parser.parse(normalHtml, { isTesting: false }),
      ...parser.parse(testingHtml, { isTesting: true }),
    ];

    const mockTemplates = parser.parse(mockTemplatesHtml, { isTesting: true });

    debug(`Loaded ${allFunctions.length} functions`);
    debug(`Loaded ${mockTemplates.length} mock templates`);

    return { allFunctions, mockTemplates };
  } catch (error) {
    console.error("Failed to load or parse documentation:", error);
    return { allFunctions: [], mockTemplates: [] };
  }
}
