import * as assert from "assert";
import { DocumentationFetcher, DocumentationUrls } from "@/shell/fetcher";
import { ERROR_FETCH_FAILED } from "@/constants";

suite("Fetcher Test Suite", () => {
  const originalFetch = global.fetch;
  const fetcher = new DocumentationFetcher();

  teardown(() => {
    global.fetch = originalFetch;
  });

  suite("getUrls", () => {
    suite("when language is English", () => {
      let urls: DocumentationUrls;

      setup(() => {
        urls = fetcher.getUrls("en");
      });

      test("it should return correct normal URL", () => {
        assert.strictEqual(
          urls.normal,
          "https://bash-stdlib.readthedocs.io/en/latest/reference/src/REFERENCE_COMPLETE.html",
        );
      });

      test("it should return correct testing URL", () => {
        assert.strictEqual(
          urls.testing,
          "https://bash-stdlib.readthedocs.io/en/latest/reference_testing/src/testing/REFERENCE_COMPLETE.html",
        );
      });
    });
  });

  suite("when fetching documentation succeeds", () => {
    const mockHtml = "<html><body>Documentation</body></html>";
    let content: string;

    setup(async () => {
      global.fetch = (async () => ({
        ok: true,
        text: async () => mockHtml,
      })) as any;

      content = await fetcher.fetch("https://example.com");
    });

    test("it should return the HTML content", () => {
      assert.strictEqual(content, mockHtml);
    });
  });

  suite("when fetching documentation fails", () => {
    let error: any;

    setup(async () => {
      global.fetch = (async () => ({
        ok: false,
        status: 404,
        statusText: "Not Found",
      })) as any;

      try {
        await fetcher.fetch("https://example.com");
      } catch (e) {
        error = e;
      }
    });

    test("it should throw an error", () => {
      assert.ok(error instanceof Error);
    });

    test("it should include the fetch failed message", () => {
      assert.ok(error.message.includes(ERROR_FETCH_FAILED));
    });

    test("it should include the status code", () => {
      assert.ok(error.message.includes("404"));
    });
  });
});
