import { MESSAGE_NO_DESCRIPTION } from "@/constants";
import { ShdocFunction, ShdocArg, ShdocExitCode } from "@/shell/shdoc";

export interface HtmlDocumentationParserOptions {
  isTesting: boolean;
}

export class HtmlDocumentationParser {
  protected readonly permalinkSymbol = "";
  protected readonly noDescriptionMessage = MESSAGE_NO_DESCRIPTION;

  public parse(
    html: string,
    options: HtmlDocumentationParserOptions,
  ): ShdocFunction[] {
    const sections = this.splitIntoSections(html);

    return sections
      .map((sectionContent) =>
        this.parseFunctionSection(sectionContent, options.isTesting),
      )
      .filter(
        (parsedFunction): parsedFunction is ShdocFunction =>
          parsedFunction !== null,
      );
  }

  protected splitIntoSections(html: string): string[] {
    const functionSectionRegex = /<section id="[^"]+">\s*<h3>/g;
    const sections: string[] = [];
    let match;
    const indices: number[] = [];

    while ((match = functionSectionRegex.exec(html)) !== null) {
      indices.push(match.index);
    }

    for (let i = 0; i < indices.length; i++) {
      const start = indices[i];
      const end = i + 1 < indices.length ? indices[i + 1] : html.length;
      sections.push(html.substring(start, end));
    }

    return sections;
  }

  protected parseFunctionSection(
    sectionHtml: string,
    isTesting: boolean,
  ): ShdocFunction | null {
    const fullFunctionName = this.extractFunctionName(sectionHtml);
    if (!fullFunctionName) {
      return null;
    }

    const { namespace, functionName } = this.parseNamespace(fullFunctionName);

    const { keywords, globals } = this.extractKeywordsAndGlobals(sectionHtml);

    return {
      name: functionName,
      namespace,
      description: this.extractDescription(sectionHtml),
      args: this.extractArguments(sectionHtml),
      globals,
      isTesting,
      keywords,
      options: [],
      exitcodes: this.extractExitCodes(sectionHtml),
    };
  }

  protected extractFunctionName(sectionHtml: string): string | null {
    const h3NameMatch = sectionHtml.match(/<h3>([^<]+)/);
    if (!h3NameMatch) {
      return null;
    }

    const rawName = h3NameMatch[1]
      .trim()
      .replace(this.permalinkSymbol, "")
      .trim();
    return this.decodeHtmlEntities(rawName);
  }

  protected parseNamespace(fullFunctionName: string): {
    namespace: string;
    functionName: string;
  } {
    const parts = fullFunctionName.split(".");
    if (parts.length <= 1) {
      return { namespace: "", functionName: fullFunctionName };
    }

    const functionName = parts[parts.length - 1];
    const namespace = parts.slice(0, -1).join(".");

    return { namespace, functionName };
  }

  protected extractDescription(sectionHtml: string): string {
    const firstParagraphAfterHeaderMatch = sectionHtml.match(
      /<\/h3>\s*<p>([\s\S]+?)<\/p>/,
    );
    const rawDescription = firstParagraphAfterHeaderMatch
      ? firstParagraphAfterHeaderMatch[1].trim()
      : this.noDescriptionMessage;

    return this.sanitizeText(rawDescription);
  }

  protected extractKeywordsAndGlobals(sectionHtml: string): {
    keywords: ShdocArg[];
    globals: ShdocArg[];
  } {
    const keywords: ShdocArg[] = [];
    const globals: ShdocArg[] = [];

    const listPattern = /<\/p>\s*<ul class="simple">([\s\S]+?)<\/ul>/;
    const listMatch = sectionHtml.match(listPattern);

    if (listMatch) {
      const listItemsHtml = listMatch[1];
      const itemPattern =
        /<li>\s*<p>\s*([^ ]+)\s+([^ ]+)\s+(keyword|global):\s*([\s\S]+?)<\/p>\s*<\/li>/g;
      const matches = listItemsHtml.matchAll(itemPattern);

      for (const match of matches) {
        const item = {
          name: match[1].trim(),
          type: match[2].trim(),
          desc: this.sanitizeText(match[4]),
        };

        if (match[3] === "keyword") {
          keywords.push(item);
        } else {
          globals.push(item);
        }
      }
    }

    return { keywords, globals };
  }

  protected extractArguments(sectionHtml: string): ShdocArg[] {
    const args: ShdocArg[] = [];
    const argumentsSectionPattern =
      /<section id="(?:arguments|id\d+)">\s*<h4>\s*Arguments[\s\S]+?<ul[^>]*>([\s\S]+?)<\/ul>/;
    const argumentsSectionMatch = sectionHtml.match(argumentsSectionPattern);

    if (argumentsSectionMatch) {
      const listItemsHtml = argumentsSectionMatch[1];
      const argListItemPattern =
        /<li>\s*<p>\s*<strong>([^<]+)<\/strong>\s*\(([^)]+)\):\s*([\s\S]+?)<\/p>\s*<\/li>/g;
      const argMatches = listItemsHtml.matchAll(argListItemPattern);

      for (const match of argMatches) {
        const argName = match[1].trim();
        args.push({
          name: argName,
          type: match[2].trim(),
          desc: this.sanitizeText(match[3]),
        });
      }
    }

    return args;
  }

  protected extractExitCodes(sectionHtml: string): ShdocExitCode[] {
    const exitCodes: ShdocExitCode[] = [];
    const exitCodesSectionPattern =
      /<section id="(?:exit-codes|id\d+)">\s*<h4>\s*Exit codes[\s\S]+?<ul[^>]*>([\s\S]+?)<\/ul>/;
    const exitCodesSectionMatch = sectionHtml.match(exitCodesSectionPattern);

    if (exitCodesSectionMatch) {
      const listItemsHtml = exitCodesSectionMatch[1];
      const exitCodeListItemPattern =
        /<li>\s*<p>\s*<strong>([^<]+)<\/strong>:\s*([\s\S]+?)<\/p>\s*<\/li>/g;
      const exitCodeMatches = listItemsHtml.matchAll(exitCodeListItemPattern);

      for (const match of exitCodeMatches) {
        exitCodes.push({
          code: match[1].trim(),
          desc: this.sanitizeText(match[2]),
        });
      }
    }

    return exitCodes;
  }

  protected decodeHtmlEntities(text: string): string {
    const entityMap: Record<string, string> = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'",
      "&#64;": "@",
    };

    return text.replace(
      /&[a-zA-Z]+;|&#\d+;/g,
      (entity) => entityMap[entity] || entity,
    );
  }

  protected sanitizeText(htmlContent: string): string {
    const textWithoutTags = htmlContent.replace(/<[^>]+>/g, "");
    const decodedText = this.decodeHtmlEntities(textWithoutTags);
    const normalizedWhitespace = decodedText.replace(/\s+/g, " ");

    return normalizedWhitespace.trim();
  }
}
