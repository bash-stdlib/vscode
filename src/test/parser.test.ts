import * as assert from "assert";
import { HtmlDocumentationParser } from "../shell/htmlParser";

suite("HTML Parser Test Suite", () => {
  const parser = new HtmlDocumentationParser();

  test("Parses a single function correctly", () => {
    const html = `
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
<li><p><strong>1</strong>: If the assertion failed.</p></li>
<li><p><strong>127</strong>: If the wrong number of arguments were provided.</p></li>
</ul>
</section>
</section>
    `;

    const functions = parser.parse(html);
    assert.strictEqual(functions.length, 1);
    const fn = functions[0];
    assert.strictEqual(fn.name, "stdlib.array.assert.is_array");
    assert.strictEqual(fn.description, "Asserts that a variable is an array.");
    assert.strictEqual(fn.args.length, 1);
    assert.strictEqual(fn.args[0].name, "$1");
    assert.strictEqual(fn.args[0].type, "string");
    assert.strictEqual(fn.args[0].desc, "The name of the variable to check.");
    assert.strictEqual(fn.exitcodes.length, 3);
    assert.strictEqual(fn.exitcodes[0].code, "0");
    assert.strictEqual(fn.exitcodes[0].desc, "If the assertion succeeded.");
  });

  test("Parses multiple functions correctly", () => {
    const html = `
<section id="stdlib-array-assert-is-array">
<h3>stdlib.array.assert.is_array</h3>
<p>Desc 1</p>
</section>
<section id="stdlib-array-assert-is-contains">
<h3>stdlib.array.assert.is_contains</h3>
<p>Desc 2</p>
</section>
    `;
    const functions = parser.parse(html);
    assert.strictEqual(functions.length, 2);
    assert.strictEqual(functions[0].name, "stdlib.array.assert.is_array");
    assert.strictEqual(functions[1].name, "stdlib.array.assert.is_contains");
  });

  test("Handles auto-generated IDs for sections", () => {
      const html = `
<section id="stdlib-array-assert-is-contains">
<h3>stdlib.array.assert.is_contains</h3>
<p>Asserts that an array contains a value.</p>
<section id="id1">
<h4>Arguments</h4>
<ul class="simple">
<li><p><strong>$1</strong> (string): The value to assert is present.</p></li>
<li><p><strong>$2</strong> (string): The name of the array.</p></li>
</ul>
</section>
<section id="id2">
<h4>Exit codes</h4>
<ul class="simple">
<li><p><strong>0</strong>: Success</p></li>
</ul>
</section>
</section>
      `;
      const functions = parser.parse(html);
      assert.strictEqual(functions.length, 1);
      const fn = functions[0];
      assert.strictEqual(fn.args.length, 2);
      assert.strictEqual(fn.args[1].name, "$2");
      assert.strictEqual(fn.exitcodes.length, 1);
      assert.strictEqual(fn.exitcodes[0].code, "0");
  });
});
