import { ShdocFunction, ShdocArg, ShdocExitCode } from "./shdoc";

export class HtmlDocumentationParser {
  public parse(html: string): ShdocFunction[] {
    // Each function documentation starts with <section id="stdlib-
    // But we need to ignore the Index section and toctree entries.
    // The actual function sections are at the h3 level.

    const functionSections = html.split('<section id="stdlib-');
    functionSections.shift(); // Remove content before first <section id="stdlib-

    return functionSections
      .map((sectionContent) => this.parseFunctionSection('<section id="stdlib-' + sectionContent))
      .filter((fn): fn is ShdocFunction => fn !== null);
  }

  private parseFunctionSection(sectionHtml: string): ShdocFunction | null {
    // Ensure this is a function section (contains h3 with function name)
    // and not just a toctree item or index link.
    const name = this.extractName(sectionHtml);
    if (!name) {
      return null;
    }

    return {
      name,
      description: this.extractDescription(sectionHtml),
      args: this.extractArguments(sectionHtml),
      options: [],
      exitcodes: this.extractExitCodes(sectionHtml),
    };
  }

  private extractName(sectionHtml: string): string | null {
    const nameMatch = sectionHtml.match(/<h3>([^<]+)/);
    if (!nameMatch) {
      return null;
    }
    const rawName = nameMatch[1].trim();
    // ReadTheDocs often adds a permalink symbol 
    return rawName.replace(/$/, "").trim();
  }

  private extractDescription(sectionHtml: string): string {
    // Description is typically the first <p> after the <h3>
    const descriptionMatch = sectionHtml.match(/<\/h3>\s*<p>([\s\S]+?)<\/p>/);
    const rawDescription = descriptionMatch ? descriptionMatch[1].trim() : "No description provided.";
    return this.stripHtml(rawDescription);
  }

  private extractArguments(sectionHtml: string): ShdocArg[] {
    const args: ShdocArg[] = [];
    // Arguments are in a sub-section with id="arguments" or an auto-generated id
    const argumentsSectionMatch = sectionHtml.match(
      /<section id="(?:arguments|id\d+)">\s*<h4>Arguments[\s\S]+?<ul[^>]*>([\s\S]+?)<\/ul>/
    );

    if (argumentsSectionMatch) {
      const listItems = argumentsSectionMatch[1];
      // Match <li><p><strong>$1</strong> (string): description</p></li>
      const argMatches = listItems.matchAll(
        /<li>\s*<p>\s*<strong>([^<]+)<\/strong>\s*\(([^)]+)\):\s*([\s\S]+?)<\/p>\s*<\/li>/g
      );

      for (const match of argMatches) {
        args.push({
          name: match[1].trim(),
          type: match[2].trim(),
          desc: this.stripHtml(match[3].trim()),
        });
      }
    }

    return args;
  }

  private extractExitCodes(sectionHtml: string): ShdocExitCode[] {
    const exitCodes: ShdocExitCode[] = [];
    const exitCodesSectionMatch = sectionHtml.match(
      /<section id="(?:exit-codes|id\d+)">\s*<h4>Exit codes[\s\S]+?<ul[^>]*>([\s\S]+?)<\/ul>/
    );

    if (exitCodesSectionMatch) {
      const listItems = exitCodesSectionMatch[1];
      // Match <li><p><strong>0</strong>: description</p></li>
      const exitCodeMatches = listItems.matchAll(/<li>\s*<p>\s*<strong>([^<]+)<\/strong>:\s*([\s\S]+?)<\/p>\s*<\/li>/g);

      for (const match of exitCodeMatches) {
        exitCodes.push({
          code: match[1].trim(),
          desc: this.stripHtml(match[2].trim()),
        });
      }
    }

    return exitCodes;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  }
}
