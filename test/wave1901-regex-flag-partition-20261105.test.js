import test from "node:test";
import assert from "node:assert/strict";
import { createRegexLanguage } from "../src/core.js";

test("rule-local flags preserve leftmost priority across CRLF and astral gaps", () => {
  const grammar = createRegexLanguage({
    id: "wave1901-partition",
    tokens: [
      { kind: "upper", pattern: /ABC/ },
      { kind: "case-insensitive", pattern: /abc/i },
      { kind: "whole-line", pattern: /^X$/m },
      { kind: "crlf", pattern: /\r\n/ },
    ],
  });
  const source = "Q\r\n🙂abc\nX\n🙂ABC";
  const expected = [
    { kind: "plain", value: "Q" },
    { kind: "crlf", value: "\r\n" },
    { kind: "plain", value: "🙂" },
    { kind: "case-insensitive", value: "abc" },
    { kind: "plain", value: "\n" },
    { kind: "whole-line", value: "X" },
    { kind: "plain", value: "\n🙂" },
    { kind: "upper", value: "ABC" },
  ];
  for (let pass = 0; pass < 3; pass++) {
    const tokens = grammar.tokenize(source);
    assert.deepEqual(tokens, expected);
    assert.equal(tokens.map(token => token.value).join(""), source);
  }
  assert.deepEqual(grammar.tokenize("abc ABC"), [
    { kind: "case-insensitive", value: "abc" },
    { kind: "plain", value: " " },
    { kind: "upper", value: "ABC" },
  ]);
});
