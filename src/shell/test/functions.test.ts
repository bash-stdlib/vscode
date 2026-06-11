import * as vscode from "vscode";
import * as assert from "assert";
import { loadFunctions } from "@/shell/functions";
import { DocumentationFetcher } from "@/shell/html/fetcher";
import { HtmlDocumentationParser } from "@/shell/html/htmlParser";
import { ShdocFunction } from "@/shell/shdoc";

suite("loadFunctions Test Suite", () => {
  let originalGetConfiguration: typeof vscode.workspace.getConfiguration;
  let originalFetcherFetch: DocumentationFetcher["fetch"];
  let originalParserParse: HtmlDocumentationParser["parse"];
  let allFunctions: ShdocFunction[];
  let mockTemplates: ShdocFunction[];

  setup(async () => {
    originalGetConfiguration = vscode.workspace.getConfiguration;
    vscode.workspace.getConfiguration = () =>
      ({ get: () => "en" }) as unknown as vscode.WorkspaceConfiguration;

    originalFetcherFetch = DocumentationFetcher.prototype.fetch;
    DocumentationFetcher.prototype.fetch = async (url: string) => {
      if (url.includes("REFERENCE_MOCK_OBJECT.html")) {
        return `<section id="object"> <h3>object</h3> <p>Mock description</p> </section>`;
      }
      return `<section id="normal.fn"> <h3>normal.fn</h3> <p>Normal function description</p> </section>`;
    };

    originalParserParse = HtmlDocumentationParser.prototype.parse;
    HtmlDocumentationParser.prototype.parse = (
      html: string,
      options: { isTesting: boolean },
    ) => {
      if (html.includes('id="object"')) {
        return [
          {
            name: "object",
            namespace: "",
            description: "Mock description",
            args: [],
            globals: [],
            keywords: [],
            options: [],
            exitcodes: [],
            isTesting: true,
          },
        ];
      }

      const name = options.isTesting ? "test_fn" : "normal_fn";
      return [
        {
          name,
          namespace: "",
          description: "description",
          args: [],
          globals: [],
          keywords: [],
          options: [],
          exitcodes: [],
          isTesting: options.isTesting,
        },
      ];
    };

    const result = await loadFunctions();
    allFunctions = result.allFunctions;
    mockTemplates = result.mockTemplates;

    vscode.workspace.getConfiguration = originalGetConfiguration;
    DocumentationFetcher.prototype.fetch = originalFetcherFetch;
    HtmlDocumentationParser.prototype.parse = originalParserParse;
  });

  test("it should load 2 functions", () => {
    assert.strictEqual(allFunctions.length, 2);
  });

  test("it should include a normal function", () => {
    const normalFn = allFunctions.find((fn) => !fn.isTesting);
    assert.ok(normalFn);
    assert.strictEqual(normalFn.name, "normal_fn");
  });

  test("it should include a testing function", () => {
    const testFn = allFunctions.find((fn) => fn.isTesting);
    assert.ok(testFn);
    assert.strictEqual(testFn.name, "test_fn");
  });

  test("it should include mock templates", () => {
    assert.strictEqual(mockTemplates.length, 1);
    assert.strictEqual(mockTemplates[0].name, "object");
  });
});
