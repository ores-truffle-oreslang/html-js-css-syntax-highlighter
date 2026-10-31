import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { defaultHighlighter } from "../src/index.js";

const corpus = JSON.parse(readFileSync(new URL("../conformance/oreslang-syntax-v1.json", import.meta.url)));

test("shared fixture pins the source lexer and distinguishes future target semantics", () => {
  assert.equal(corpus.schema, "oreslang.editor-syntax-conformance/v1");
  assert.equal(corpus.authority.repo, "ores-truffle-oreslang/oreslang-source.java");
  assert.equal(corpus.authority.files.length, 2);
  assert.equal(corpus.cases.length, 50);
  assert.ok(corpus.profiles.compilerMainObservation.reserved.includes("isoactor"));
  assert.ok(corpus.profiles.editorTarget.excludedReservedWords.includes("isoactor"));
  assert.equal(new Set(corpus.cases.map(c => c.id)).size, corpus.cases.length);
  assert.ok(corpus.evidenceBoundary.includes("does not establish"));
});

for (const fixture of corpus.cases) {
  test("shared editor lexical contract: " + fixture.id, () => {
    const tokens = defaultHighlighter.tokenize(fixture.source, "oreslang");
    assert.equal(tokens.map(t => t.value).join(""), fixture.source,
      "tokens must conserve every input character");
    const keywords = tokens.filter(t => t.kind === "keyword").map(t => t.value);
    const globals = tokens.filter(t => t.kind === "runtimeGlobal").map(t => t.value);
    const symbols = tokens.filter(t => t.kind === "symbol").map(t => t.value);
    for (const word of fixture.keywords) {
      assert.ok(keywords.includes(word), "missing keyword " + word);
    }
    for (const word of fixture.notKeywords) {
      assert.ok(!keywords.includes(word), "false keyword " + word);
    }
    for (const word of fixture.globals) {
      assert.ok(globals.includes(word), "missing runtime global " + word);
    }
    for (const word of fixture.notGlobals) {
      assert.ok(!globals.includes(word), "false runtime global " + word);
    }
    for (const word of fixture.symbols) {
      assert.ok(symbols.includes(word), "missing atomic symbol " + word);
    }
  });
}
