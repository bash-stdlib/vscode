import { ShdocFunction, ShdocArg, ShdocExitCode } from "@/shell/shdoc";

export class HtmlDocumentationParser {
  protected readonly sectionIdPrefix = '<section id="stdlib-';
  protected readonly permalinkSymbol = "";
  protected readonly noDescriptionMessage = "No description provided.";

  public parse(html: string): ShdocFunction[] {
    const rawSections = html.split(this.sectionIdPrefix);
    const potentialFunctionSections = rawSections.slice(1);

    return potentialFunctionSections
      .map((sectionContent) => this.parseFunctionSection(this.sectionIdPrefix + sectionContent))
      .filter((parsedFunction): parsedFunction is ShdocFunction => parsedFunction !== null);
  }

  protected parseFunctionSection(sectionHtml: string): ShdocFunction | null {
    const functionName = this.extractFunctionName(sectionHtml);
    if (!functionName) {
      return null;
    }

    return {
      name: functionName,
      description: this.extractDescription(sectionHtml),
      args: this.extractArguments(sectionHtml),
      options: [],
      exitcodes: this.extractExitCodes(sectionHtml),
    };
  }

  protected extractFunctionName(sectionHtml: string): string | null {
    const h3NameMatch = sectionHtml.match(/<h3>([^<]+)/);
    if (!h3NameMatch) {
      return null;
    }

    return h3NameMatch[1].trim().replace(this.permalinkSymbol, "").trim();
  }

  protected extractDescription(sectionHtml: string): string {
    const firstParagraphAfterHeaderMatch = sectionHtml.match(/<\/h3>\s*<p>([\s\S]+?)<\/p>/);
    const rawDescription = firstParagraphAfterHeaderMatch ? firstParagraphAfterHeaderMatch[1].trim() : this.noDescriptionMessage;

    return this.sanitizeText(rawDescription);
  }

  protected extractArguments(sectionHtml: string): ShdocArg[] {
    const args: ShdocArg[] = [];
    const argumentsSectionPattern = /<section id="(?:arguments|id\d+)">\s*<h4>Arguments[\s\S]+?<ul[^>]*>([\s\S]+?)<\/ul>/;
    const argumentsSectionMatch = sectionHtml.match(argumentsSectionPattern);

    if (argumentsSectionMatch) {
      const listItemsHtml = argumentsSectionMatch[1];
      const argListItemPattern = /<li>\s*<p>\s*<strong>([^<]+)<\/strong>\s*\(([^)]+)\):\s*([\s\S]+?)<\/p>\s*<\/li>/g;
      const argMatches = listItemsHtml.matchAll(argListItemPattern);

      for (const match of argMatches) {
        args.push({
          name: match[1].trim(),
          type: match[2].trim(),
          desc: this.sanitizeText(match[3]),
        });
      }
    }

    return args;
  }

  protected extractExitCodes(sectionHtml: string): ShdocExitCode[] {
    const exitCodes: ShdocExitCode[] = [];
    const exitCodesSectionPattern = /<section id="(?:exit-codes|id\d+)">\s*<h4>Exit codes[\s\S]+?<ul[^>]*>([\s\S]+?)<\/ul>/;
    const exitCodesSectionMatch = sectionHtml.match(exitCodesSectionPattern);

    if (exitCodesSectionMatch) {
      const listItemsHtml = exitCodesSectionMatch[1];
      const exitCodeListItemPattern = /<li>\s*<p>\s*<strong>([^<]+)<\/strong>:\s*([\s\S]+?)<\/p>\s*<\/li>/g;
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

  protected sanitizeText(htmlContent: string): string {
    const textWithoutTags = htmlContent.replace(/<[^>]+>/g, "");
    const normalizedWhitespace = textWithoutTags.replace(/\s+/g, " ");

    return normalizedWhitespace.trim();
  }
}
