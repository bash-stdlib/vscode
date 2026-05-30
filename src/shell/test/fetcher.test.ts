import * as assert from "assert";
import { fetchDocumentation } from "@/shell/fetcher";
import { FETCH_ERROR_MESSAGE } from "@/shell/constants";

suite("Fetcher Test Suite", () => {
  const originalFetch = global.fetch;

  setup(() => {
    // Mock global fetch if needed, but since we are in Node/Electron environment,
    // it might be available.
  });

  teardown(() => {
    global.fetch = originalFetch;
  });

  suite("when fetching documentation succeeds", () => {
    const mockHtml = "<html><body>Documentation</body></html>";

    setup(() => {
      global.fetch = (async () => ({
        ok: true,
        text: async () => mockHtml,
      })) as any;
    });

    test("it should return the HTML content", async () => {
      const content = await fetchDocumentation("https://example.com");
      assert.strictEqual(content, mockHtml);
    });
  });

  suite("when fetching documentation fails", () => {
    setup(() => {
      global.fetch = (async () => ({
        ok: false,
        status: 404,
        statusText: "Not Found",
      })) as any;
    });

    test("it should throw an error with the correct message", async () => {
      try {
        await fetchDocumentation("https://example.com");
        assert.fail("Should have thrown an error");
      } catch (error) {
        if (error instanceof Error) {
          assert.ok(error.message.includes(FETCH_ERROR_MESSAGE));
          assert.ok(error.message.includes("404"));
        } else {
          assert.fail("Error should be an instance of Error");
        }
      }
    });
  });
});
