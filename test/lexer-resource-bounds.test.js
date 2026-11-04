import test from "node:test";
import assert from "node:assert/strict";
import { defaultHighlighter } from "../src/index.js";

const tokenize = text => defaultHighlighter.tokenize(text, "oreslang");
const rebuild = tokens => tokens.map(token => token.value).join("");

test("oversized decoded Symbol buffers stay shielded and source-preserving", () => {
  for (const invalid of [
    '#"' + "raise #ready ".repeat(22_000) + '"',
    '#"\\q' + "return #ready ".repeat(22_000) + '"',
    "#'" + "throw #ready ".repeat(22_000) + "'"
  ]) {
    const source = invalid + "\nreturn #ready";
    const tokens = tokenize(source);
    assert.equal(rebuild(tokens), source);
    assert.equal(tokens[0].kind, "plain", "oversized literal must not become code");
    assert.equal(tokens[0].value, invalid, "invalid body must stay one opaque token");
    assert.deepEqual(
      tokens.filter(t => t.kind === "keyword" && t.value === "return")
        .map(t => t.value), ["return"]);
    assert.deepEqual(
      tokens.filter(t => t.kind === "symbol" && t.value.startsWith("#"))
        .map(t => t.value), ["#ready"]);
    assert.equal(tokens.filter(t => t.kind === "runtimeGlobal").length, 0);
  }
});

test("native-compatible block nesting limit is inclusive and fails closed", () => {
  const valid = "/*".repeat(4_096) + "raise #ready"
    + "*/".repeat(4_096) + "\nreturn #ready";
  const validTokens = tokenize(valid);
  assert.equal(rebuild(validTokens), valid);
  assert.equal(validTokens.filter(t => t.kind === "comment").length, 1);
  assert.deepEqual(
    validTokens.filter(t => t.kind === "symbol").map(t => t.value),
    ["#ready"]);

  const invalid = "before " + "/*".repeat(4_097) + "raise #ready"
    + "*/".repeat(4_097) + " return #ready";
  assert.deepEqual(tokenize(invalid), [{kind: "plain", value: invalid}]);
});
