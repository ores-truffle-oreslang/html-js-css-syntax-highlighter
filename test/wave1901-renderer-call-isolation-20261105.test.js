import test from "node:test";
import assert from "node:assert/strict";
import { SyntaxHighlighter, escapeHtml } from "../src/core.js";

test("rendering uses only per-call class prefix and escapes both plain and token data", () => {
  const hostileKind = 'quote" onmouseover="bad&<';
  const language = {
    kind: "language",
    id: "wave1901-markup",
    aliases: ["wave1901-short"],
    tokenize: source => [
      { kind: "plain", value: "&<" },
      { kind: hostileKind, value: source },
    ],
  };
  const highlighter = new SyntaxHighlighter({ languages: [language] });
  const source = "&<\"'🙂";
  const prefixes = ['one" &<', "two' <> ", "tok-"];
  for (const prefix of prefixes) {
    const options = Object.freeze({ classPrefix: prefix });
    const expected = "&amp;&lt;<span class=\"" +
      escapeHtml(prefix + hostileKind) + "\">" +
      escapeHtml(source) + "</span>";
    assert.equal(highlighter.highlight(source, "wave1901-short", options), expected);
    assert.equal(highlighter.highlight(source, "wave1901-markup", options), expected);
    assert.equal(options.classPrefix, prefix);
  }
  const baseline = "&amp;&lt;<span class=\"" +
    escapeHtml("tok-" + hostileKind) + "\">" + escapeHtml(source) + "</span>";
  assert.equal(highlighter.highlight(source, "wave1901-markup"), baseline);
});
