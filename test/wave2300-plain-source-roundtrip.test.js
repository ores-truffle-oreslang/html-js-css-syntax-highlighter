import test from "node:test";
import assert from "node:assert/strict";
import { createRegexLanguage } from "../src/core.js";

test("unmatched Unicode and CRLF remain an exact single plain token, across interleaved scans", () => {
  const grammar = createRegexLanguage({
    id:"wave2300-roundtrip",
    tokens:[{kind:"word",pattern:/canonical/}, {kind:"number",pattern:/[0-9]+/}],
  });
  const plainSamples = [
    "", "🙂\r\n\u0000Ω", "\ud800\udc00", "\ud800", "\udc00",
    "prefix\r\nsuffix\n🧪", "&<>'\" \t\u2028",
  ];
  for (const input of plainSamples) {
    for (let turn=0;turn<3;turn++) {
      const tokens=grammar.tokenize(input);
      assert.deepEqual(tokens,input ? [{kind:"plain",value:input}] : []);
      assert.equal(tokens.map(t=>t.value).join(""),input);
      const matched=grammar.tokenize("canonical 123");
      assert.equal(matched.map(t=>t.value).join(""),"canonical 123");
    }
  }
});
