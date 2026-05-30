import * as vscode from "vscode";
import { debug } from "@/debug";
import { DocumentationFetcher } from "@/shell/html/fetcher";
import { HtmlDocumentationParser } from "@/shell/html/htmlParser";
import { ShdocFunction } from "@/shell/shdoc";

export async function loadFunctions(): Promise<ShdocFunction[]> {
  const config = vscode.workspace.getConfiguration("bash-stdlib");
  const language = config.get<string>("documentationLanguage") || "en";

  try {
    const fetcher = new DocumentationFetcher();
    const urls = fetcher.getUrls(language);

    const [normalHtml, testingHtml] = await Promise.all([
      fetcher.fetch(urls.normal),
      fetcher.fetch(urls.testing),
    ]);

    const parser = new HtmlDocumentationParser();
    const allFunctions = [
      ...parser.parse(normalHtml, { isTesting: false }),
      ...parser.parse(testingHtml, { isTesting: true }),
    ];

    debug(`Loaded ${allFunctions.length} functions`);
    debug("Sample functions:", allFunctions.slice(0, 3));

    return allFunctions;
  } catch (error) {
    console.error("Failed to load or parse documentation:", error);
    return [];
  }
}
