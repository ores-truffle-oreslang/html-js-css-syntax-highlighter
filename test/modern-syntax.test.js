import test from "node:test";
import assert from "node:assert/strict";

import { defaultHighlighter, highlight } from "../src/index.js";

test("hash symbols and quoted hash symbols remain atomic, escaped tokens", () => {
  const source = "match #ready over on #'with spaces' -> { return #\"quoted value\"; } end";
  const tokens = defaultHighlighter.tokenize(source, "oreslang");
  assert.equal(tokens.map(token => token.value).join(""), source);
  assert.deepEqual(
    tokens.filter(token => token.kind === "symbol" && token.value.startsWith("#"))
      .map(token => token.value),
    ["#ready", "#'with spaces'", '#"quoted value"']
  );
  const rendered = highlight('return #"<script>alert(1)</script>";', "oreslang");
  assert.ok(rendered.includes('class="tok-symbol"'), rendered);
  assert.ok(!rendered.includes("<script>"), rendered);
  assert.ok(rendered.includes("&lt;script&gt;"), rendered);
});

test("compound Oreslang keywords remain whole lexical tokens", () => {
  const source = "critical-read critical-write nb-select transform-pipe";
  const tokens = defaultHighlighter.tokenize(source, "oreslang");
  assert.deepEqual(
    tokens.filter(token => token.kind === "keyword").map(token => token.value),
    ["critical-read", "critical-write", "nb-select", "transform-pipe"]
  );
  assert.equal(tokens.map(token => token.value).join(""), source);
});

test("large token streams do not exceed JavaScript's spread argument limit", () => {
  const source = "return ".repeat(100000);
  const tokens = defaultHighlighter.tokenize(source, "oreslang");
  assert.equal(tokens.filter(token => token.kind === "keyword").length, 100000);
  assert.equal(tokens.map(token => token.value).join(""), source);
});
