import test from "node:test";
import assert from "node:assert/strict";

import { SyntaxHighlighter, createRegexLanguage } from "../src/core.js";
import { oreslang } from "../src/plugins/oreslang.js";
import { html } from "../src/plugins/html.js";

test("registering a colliding language ID cannot replace an existing grammar", () => {
  const highlighter = new SyntaxHighlighter({ languages: [oreslang] });
  const impersonator = createRegexLanguage({ id: "oreslang", tokens: [
    { kind: "plain", pattern: /./ },
  ] });
  assert.throws(() => highlighter.use(impersonator), /registration conflict: oreslang/);
  assert.equal(highlighter.language("oreslang"), oreslang);
  assert.equal(highlighter.language("ores"), oreslang);
});

test("a colliding alias rejects the whole registration without leaving a partial ID", () => {
  const highlighter = new SyntaxHighlighter({ languages: [oreslang, html] });
  const plugin = createRegexLanguage({ id: "new-lang", aliases: ["safe", "ores"], tokens: [
    { kind: "plain", pattern: /./ },
  ] });
  assert.throws(() => highlighter.use(plugin), /registration conflict: ores/);
  assert.equal(highlighter.language("new-lang"), undefined);
  assert.equal(highlighter.language("safe"), undefined);
  assert.equal(highlighter.language("ores"), oreslang);
  assert.equal(highlighter.language("html"), html);
});

test("idempotent same-plugin registration and self aliases remain supported", () => {
  const highlighter = new SyntaxHighlighter({ languages: [oreslang] });
  highlighter.use(oreslang);
  assert.equal(highlighter.language("ores-lang"), oreslang);
});

test("reject invalid aliases before mutating the language registry", () => {
  const highlighter = new SyntaxHighlighter();
  const malformed = {kind:"language", id:"custom", aliases:["ok", ""], tokenize:()=>[]};
  assert.throws(() => highlighter.use(malformed), /non-empty strings/);
  assert.equal(highlighter.language("custom"), undefined);
  assert.equal(highlighter.language("ok"), undefined);
});
