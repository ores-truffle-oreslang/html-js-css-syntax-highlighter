import test from "node:test";
import assert from "node:assert/strict";
import { createRegexLanguage, SyntaxHighlighter } from "../src/core.js";

// Host lexical/rendering checks only; this does not execute the AttoLang parser.
const language = createRegexLanguage({
  id: "astral-zero-width-wave32",
  tokens: [
    { kind: "empty", pattern: /(?=.)/ },
    { kind: "letter", pattern: /A/ },
  ],
});

test("zero-width rules advance over complete astral code points", () => {
  assert.deepEqual(language.tokenize("😀A"), [
    { kind: "plain", value: "😀" },
    { kind: "letter", value: "A" },
  ]);
});

test("repeated astral scalars never cause zero-width token emissions", () => {
  const source = "🚀".repeat(64) + "A";
  const tokens = language.tokenize(source);
  assert.deepEqual(tokens, [
    { kind: "plain", value: "🚀".repeat(64) },
    { kind: "letter", value: "A" },
  ]);
  assert.equal(tokens.map((t) => t.value).join(""), source);
});

test("renderer escapes classPrefix and token contents independently", () => {
  const highlighter = new SyntaxHighlighter({ languages: [language] });
  const html = highlighter.highlight("<A&", language.id, { classPrefix: 'x" onclick="alert(1)' });
  assert.ok(html.includes("&lt;"));
  assert.ok(html.includes("&amp;"));
  assert.ok(html.includes('class="x&quot; onclick=&quot;alert(1)letter"'));
  assert.equal(html.includes('class="x" onclick='), false);
});

test("tokenization has no stale global-regexp cursor between calls", () => {
  assert.deepEqual(language.tokenize("A"), [{kind: "letter", value: "A"}]);
  assert.deepEqual(language.tokenize("A"), [{kind: "letter", value: "A"}]);
});
