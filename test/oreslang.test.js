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
  assert.match(html, /<span class="tok-keyword">structural<\/span>/);
  assert.match(html, /<span class="tok-keyword">end<\/span>/);
  assert.match(html, /<span class="tok-keyword">match<\/span>/);
  assert.match(html, /<span class="tok-keyword">on<\/span>/);
});

test("static fnc is highlighted, without matching keyword prefixes inside identifiers", () => {
  const html = highlight("static fnc build(): void { return; }", "oreslang");
  assert.match(html, /<span class="tok-keyword">static<\/span>/);
  assert.match(html, /<span class="tok-keyword">fnc<\/span>/);
  const identifiers = highlight("overlap structuralize statician", "oreslang");
  assert.ok(!identifiers.includes('class="tok-keyword"'));
});

test("logical and/or words use keyword precedence without matching identifier substrings", () => {
  const html = highlight("return ready and healthy or fallback;", "oreslang");
  assert.match(html, /<span class="tok-keyword">and<\/span>/);
  assert.match(html, /<span class="tok-keyword">or<\/span>/);

  const identifiers = highlight("candy oracle android", "oreslang");
  assert.ok(!identifiers.includes('class="tok-keyword"'));
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

test("logical words are keywords but comparisons are contextual operators", () => {
  const html = highlight("return a and b or (a eq b) and (a neq c);", "oreslang");
  for (const word of ["and", "or"]) {
    assert.ok(html.includes('<span class="tok-keyword">' + word + '</span>'), html);
  }
  for (const word of ["eq", "neq"]) {
    assert.ok(html.includes('<span class="tok-operator">' + word + '</span>'), html);
  }
  const identifiers = highlight("let eq = 1; let is = 2; let neq = 3;", "oreslang");
  for (const word of ["eq", "is", "neq"]) {
    assert.ok(!identifiers.includes('<span class="tok-keyword">' + word + '</span>'));
    assert.ok(!identifiers.includes('<span class="tok-operator">' + word + '</span>'));
  }
});

test("removed symbolic operators and xor keyword are not falsely highlighted", () => {
  const html = highlight("return Mod(a, b) ^ c % d ^^ x xor z; Xor(true, false)", "oreslang");
  for (const symbol of ["^", "%", "^^"]) {
    assert.ok(!html.includes('<span class="tok-operator">' + symbol + '</span>'), html);
  }
  assert.ok(!html.includes('<span class="tok-keyword">xor</span>'), html);
  assert.ok(!html.includes('<span class="tok-keyword">Xor</span>'), html);
});

test("nested comments and templates cannot leak keywords or markup", () => {
  const source = '/* outer /* inner */ return; */ define isolated actor Example as `if { return }` end';
  const tokens = defaultHighlighter.tokenize(source, "oreslang");
  assert.equal(tokens.map(t => t.value).join(""), source);
  assert.equal(tokens.filter(t => t.kind === 'comment').length, 1);
  assert.ok(!tokens.some(t => t.kind === 'keyword' && t.value === 'return'));
  for (const keyword of ['define', 'isolated', 'actor', 'end']) {
    assert.ok(tokens.some(t => t.kind === 'keyword' && t.value === keyword), keyword);
  }
});
