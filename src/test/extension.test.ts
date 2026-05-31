import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  const getExtension = () => {
    return vscode.extensions.all.find((e) => e.packageJSON.name === "bash-stdlib");
  };

  test("Extension should be present", () => {
    const extension = getExtension();
    assert.ok(extension, "Extension should be found by name in packageJSON");
  });

  suite("when extension is activated", () => {
    let extension: vscode.Extension<any> | undefined;

    setup(async () => {
      mockFetchWithStaticDocumentation();

      extension = getExtension();
      await extension?.activate();
    });

    test("it should be active", () => {
      assert.strictEqual(extension?.isActive, true);
    });

    suite("when completions are requested for shellscript", () => {
      let completions: vscode.CompletionList | undefined;

      setup(async () => {
        const document = await vscode.workspace.openTextDocument({
          language: "shellscript",
          content: "stdlib.",
        });
        const position = new vscode.Position(0, 7);

        completions = await vscode.commands.executeCommand<vscode.CompletionList>(
          "vscode.executeCompletionItemProvider",
          document.uri,
          position
        );
      });

      test("it should return a completion list", () => {
        assert.ok(completions, "Completion list should be returned");
      });

      test("it should contain function items", () => {
        const hasFunctions = completions?.items.some(
          (item) => item.kind === vscode.CompletionItemKind.Function
        );
        assert.strictEqual(hasFunctions, true, "Completion list should contain function items");
      });

      test("it should have completion items with documentation", () => {
          const itemsWithDoc = completions?.items.filter(item => item.documentation);
          assert.ok(itemsWithDoc && itemsWithDoc.length > 0, "Should have items with documentation");
      });
    });

    suite("when hover is requested for shellscript", () => {
      let hovers: vscode.Hover[] | undefined;

      setup(async () => {
        const document = await vscode.workspace.openTextDocument({
          language: "shellscript",
          content: "stdlib.array.assert.is_array",
        });
        const position = new vscode.Position(0, 7);

        hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
          "vscode.executeHoverProvider",
          document.uri,
          position
        );
      });

      test("it should return a hover", () => {
        assert.ok(hovers && hovers.length > 0, "Hover should be returned");
      });

      test("it should contain documentation", () => {
        const hover = hovers![0];
        assert.ok(hover.contents.length > 0, "Hover should have contents");
        const markdown = hover.contents[0] as vscode.MarkdownString;
        assert.ok(markdown.value.includes("**Description:**"), "Hover should contain Description");
      });
    });
  });
});

function mockFetchWithStaticDocumentation() {
  global.fetch = (async () => ({
    ok: true,
    text: async () => `
      <section id="stdlib-array-assert-is-array">
        <h3>stdlib.array.assert.is_array<a class="headerlink" href="#stdlib-array-assert-is-array" title="Link to this heading"></a></h3>
        <p>Asserts that a variable is an array.</p>
        <section id="arguments">
          <h4>Arguments<a class="headerlink" href="#arguments" title="Link to this heading"></a></h4>
          <ul class="simple">
            <li><p><strong>$1</strong> (string): The name of the variable to check.</p></li>
          </ul>
        </section>
        <section id="exit-codes">
          <h4>Exit codes<a class="headerlink" href="#exit-codes" title="Link to this heading"></a></h4>
          <ul class="simple">
            <li><p><strong>0</strong>: If the assertion succeeded.</p></li>
          </ul>
        </section>
      </section>
    `,
  })) as any;
}
