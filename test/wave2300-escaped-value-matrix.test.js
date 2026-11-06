import test from "node:test";
import assert from "node:assert/strict";
import { SyntaxHighlighter, escapeHtml } from "../src/core.js";

test("HTML renderer escapes each hostile token field independently across repeated calls", () => {
  const value = "&<>\"'\u2028🙂";
  const kind = "\"'&<=>";
  const language = Object.freeze({
    kind: "language",
    id: "wave2300-escaped",
    tokenize: () => Object.freeze([
      Object.freeze({kind:"plain",value}),
      Object.freeze({kind,value}),
    ]),
  });
  const h = new SyntaxHighlighter({languages:[language]});
  for (const prefix of ["", "x-&'", "\"<style>"]) {
    const options = Object.freeze({classPrefix:prefix});
    const expected = escapeHtml(value) + '<span class="' +
      escapeHtml(prefix+kind) + '">' + escapeHtml(value) + "</span>";
    assert.equal(h.highlight(value, language.id, options), expected);
    assert.equal(h.highlight(value, language.id, options), expected);
  }
  assert.equal(h.highlight(value, language.id).includes('class="tok-&quot;'), true);
});
