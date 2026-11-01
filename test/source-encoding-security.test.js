import test from "node:test";
import assert from "node:assert/strict";
import { defaultHighlighter } from "../src/index.js";

const tokenize = source => defaultHighlighter.tokenize(source, "oreslang");
const backtick=String.fromCharCode(96);

test("NUL and malformed UTF-16 fail closed regardless of source context", () => {
  const high=String.fromCharCode(0xd800);
  const low=String.fromCharCode(0xdc00);
  const malformed=[
    "\0",
    "return\0#ready",
    "// comment "+high+" return",
    "/* hidden "+low+" */ return",
    '"quoted '+high+'" return',
    backtick+"raw "+low+backtick+" #ready",
    '#"quoted '+high+'" return',
    "foo"+high+low+low+" return"
  ];
  for(const source of malformed) {
    const tokens=tokenize(source);
    assert.deepEqual(tokens,[{kind:"plain",value:source}]);
    assert.ok(!tokens.some(x=>x.kind==="symbol"||x.kind==="keyword"||x.kind==="runtimeGlobal"));
  }
});

test("valid surrogate pairs and benign non-ASCII text retain ordinary lexical scopes", () => {
  for(const source of [
    '"😀" return #ready',
    '/* 🎉 comment */ return #ready',
    '#"emoji 😁" return'
  ]) {
    const tokens=tokenize(source);
    assert.equal(tokens.map(t=>t.value).join(""),source);
    assert.ok(tokens.some(t=>t.kind==="keyword"&&t.value==="return"),source);
    assert.ok(tokens.some(t=>t.kind==="symbol"),source);
  }
});
