import test from "node:test";
import assert from "node:assert/strict";

import { defaultHighlighter, highlight } from "../src/index.js";

const tokensOf = source => defaultHighlighter.tokenize(source,"oreslang");
const reconstruction = tokens => tokens.map(t=>t.value).join("");

test("unterminated quoted Symbol is plain text, never a valid Symbol",()=>{
  for(const source of ['#"unterminated return', "#'unterminated raise"]) {
    const tokens=tokensOf(source);
    assert.equal(reconstruction(tokens),source);
    assert.ok(!tokens.some(t=>t.kind==="symbol"),source);
    assert.ok(!tokens.some(t=>t.kind==="keyword"||t.kind==="runtimeGlobal"),source);
  }
});

test("newline terminates a malformed Symbol without swallowing the following source line",()=>{
  for(const source of ['#"not closed\nreturn', "#'not closed\r\nraise"]) {
    const tokens=tokensOf(source);
    assert.equal(reconstruction(tokens),source);
    assert.ok(!tokens.some(t=>t.kind==="symbol"),source);
    assert.ok(tokens.some(t=>t.kind==="keyword" && t.value==="return") ||
      tokens.some(t=>t.kind==="runtimeGlobal" && t.value==="raise"),source);
  }
});

test("nested comment depth and HTML-looking bodies never leak syntax",()=>{
  for(const depth of [1,2,3,31,256,1024]) {
    const source="/*".repeat(depth)+' return raise #ready <svg onload="alert(1)"> '+
      "*/".repeat(depth)+" return";
    const tokens=tokensOf(source);
    assert.equal(reconstruction(tokens),source);
    assert.equal(tokens.filter(t=>t.kind==="comment").length,1);
    assert.deepEqual(tokens.filter(t=>t.kind==="keyword" && t.value==="return").map(t=>t.value),["return"]);
    assert.ok(!tokens.some(t=>t.kind==="runtimeGlobal"),String(depth));
    const html=highlight(source,"oreslang");
    assert.ok(!html.includes("<svg"),String(depth));
    assert.ok(html.includes("&lt;svg"),String(depth));
  }
});

test("deterministic adversarial literal/comment combinations preserve source and prevent leakage",()=>{
  let seed=0x48f37a21;
  for(let i=0;i<384;i++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const depth=1+(seed%19);
    const quoted=seed&1 ? '#"raise \\" escaped"' : "#'throw with spaces'";
    const source="/*".repeat(depth)+" return throw #ready "+"*/".repeat(depth)+
       " "+quoted+' "recover" '+"\`defer\`"+' return';
    const tokens=tokensOf(source);
    assert.equal(reconstruction(tokens),source,i);
    assert.equal(tokens.filter(t=>t.kind==="keyword" && t.value==="return").length,1,i);
    assert.ok(!tokens.some(t=>t.kind==="runtimeGlobal"),i);
    assert.equal(tokens.filter(t=>t.kind==="symbol").length,1,i);
  }
});
