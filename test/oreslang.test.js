import test from "node:test";
import assert from "node:assert/strict";

import { defaultHighlighter, highlight } from "../src/index.js";
import { highlightForAstro } from "../src/adapters/astro.js";

const sample = `match account over
  on structural {id: string, active: bool} a -> {
    return a.id;
  }
  on _ -> {
    return "unknown";
  }
end`;

test("Oreslang marks over and end as keywords", () => {
  const html = highlight(sample, "oreslang");

  assert.match(html, /<span class="tok-keyword">over<\/span>/);
  assert.match(html, /<span class="tok-keyword">end<\/span>/);
  assert.match(html, /<span class="tok-keyword">match<\/span>/);
  assert.match(html, /<span class="tok-keyword">on<\/span>/);
});

test("highlighting escapes raw HTML before rendering", () => {
  const html = highlight(`const x = "<script>alert(1)</script>";`, "oreslang");
  assert.ok(!html.includes("<script>"));
  assert.match(html, /&lt;script&gt;/);
});

test("aliases resolve to the same Oreslang plugin", () => {
  assert.equal(defaultHighlighter.language("ores"), defaultHighlighter.language("oreslang"));
});

test("Astro adapter returns set:html-ready markup", () => {
  const result = highlightForAstro(defaultHighlighter, "return Option.none();", "oreslang");
  assert.match(result.html, /tok-keyword/);
  assert.match(result.html, /tok-type/);
});

test("unknown languages fail loudly", () => {
  assert.throws(() => highlight("x", "not-a-language"), /unknown language/);
});
