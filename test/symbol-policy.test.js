import test from "node:test";
import assert from "node:assert/strict";
import { defaultHighlighter } from "../src/index.js";

const tokenize = source => defaultHighlighter.tokenize(source, "oreslang");
const symbols = source => tokenize(source).filter(token => token.kind === "symbol" && token.value.startsWith("#"));

test("compiler-valid Symbol escapes remain atomic and source-identical", () => {
  for (const source of [
    "#ready", "#'with spaces'", '#"quoted value"',
    String.raw`#"\u0061"`,
    String.raw`#"escaped \" quote"`,
    String.raw`#'single \' quote'`
  ]) {
    assert.deepEqual(symbols(source).map(x => x.value), [source], source);
    assert.equal(tokenize(source).map(x=>x.value).join(""), source);
  }
});

test("invalid Symbol escapes, names and budgets never claim successful Symbol tokenization", () => {
  const invalid = [
    String.raw`#"bad\q"`,
    String.raw`#"bad\uZZZZ"`,
    String.raw`#"\uD800"`,
    String.raw`#"\u202e"`,
    String.raw`#"\n"`,
    '#""', "#''", 
    "#"+ "a".repeat(129),
    '#"'+"é".repeat(129)+'"',
    '#"'+"e".repeat(1025)+'"'
  ];
  for (const source of invalid) {
    const tokens=tokenize(source);
    assert.deepEqual(symbols(source), [],source.slice(0,40));
    assert.equal(tokens.map(x=>x.value).join(""),source);
  }
});

test("an invalid quoted Symbol cannot consume a following valid source line", () => {
  const source=String.raw`#"bad\q"`+"\nreturn";
  const invalid=tokenize(source);
  assert.equal(invalid.map(x=>x.value).join(""),source);
  assert.deepEqual(symbols(source),[]);
  assert.deepEqual(invalid.filter(t=>t.kind==="keyword"&&t.value==="return").map(t=>t.value),["return"]);
  const source2='#"missing\nreturn';
  const two=tokenize(source2);
  assert.equal(two.map(x=>x.value).join(""),source2);
  assert.deepEqual(symbols(source2),[]);
  assert.equal(two.filter(t=>t.kind==="keyword"&&t.value==="return").length,1);
});

test("bounded ASCII hash names preserve exact 128-byte compiler limit",()=>{
  assert.equal(symbols("#"+"a".repeat(128)).length,1);
  assert.deepEqual(symbols("#"+"a".repeat(129)),[]);
});
