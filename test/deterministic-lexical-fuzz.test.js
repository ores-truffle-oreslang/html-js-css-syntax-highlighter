import test from "node:test";
import assert from "node:assert/strict";
import { defaultHighlighter } from "../src/index.js";

const tokenize = text => defaultHighlighter.tokenize(text, "oreslang");
const concat = tokens => tokens.map(x => x.value).join("");
function deterministic(seed) {
  let state=seed >>> 0;
  return max => {
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    return state%max;
  };
}

test("384 deterministic Unicode Symbol cases are lossless and atomic", () => {
  const next=deterministic(0x5a17c0de);
  const scalars=["a","z","_","7","é","中","😀","e","\u0301"];
  for(let caseNo=0;caseNo<384;caseNo++) {
    let name="";
    const len=1+next(32);
    for(let k=0;k<len;k++) name+=scalars[next(scalars.length)];
    const source='#"'+name+'" return';
    const tokens=tokenize(source);
    assert.equal(concat(tokens),source,caseNo);
    assert.deepEqual(tokens.filter(x=>x.kind==="symbol").map(x=>x.value),['#"'+name+'"'],caseNo);
    assert.deepEqual(tokens.filter(x=>x.kind==="keyword"&&x.value==="return").map(x=>x.value),["return"],caseNo);
  }
});

test("256 deterministic nested comment cases cannot leak Symbol or runtime tokens", () => {
  const next=deterministic(0xc011ab1e);
  for(let caseNo=0;caseNo<256;caseNo++) {
    const depth=1+next(256);
    const source="/*".repeat(depth)+' throw raise #ready "return" '+
      "*/".repeat(depth)+" return";
    const tokens=tokenize(source);
    assert.equal(concat(tokens),source,caseNo);
    assert.equal(tokens.filter(x=>x.kind==="comment").length,1,caseNo);
    assert.equal(tokens.filter(x=>x.kind==="symbol"||x.kind==="runtimeGlobal").length,0,caseNo);
    assert.deepEqual(tokens.filter(x=>x.kind==="keyword").map(x=>x.value),["return"],caseNo);
  }
});

test("384 malformed UTF-16 cases fail closed in code, comments and literals", () => {
  const next=deterministic(0xbadc0de);
  const high=String.fromCharCode(0xd800),low=String.fromCharCode(0xdc00);
  const backtick=String.fromCharCode(96);
  const surrounds=["","/*","//",'"',"'",backtick,'#"',"return "];
  for(let caseNo=0;caseNo<384;caseNo++) {
    const broken=next(2)===0?high:low;
    const source=surrounds[next(surrounds.length)] +
      "a".repeat(next(24))+broken+"b".repeat(next(24))+" return";
    assert.deepEqual(tokenize(source),[{kind:"plain",value:source}],caseNo);
  }
});
