import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
import {defaultHighlighter} from "../src/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const raw = fs.readFileSync(path.join(here,"../contracts/editor-syntax/v1/editor-lexical-contract.json"));
const SHA = "e9dbf3b6fad5562b7ca6df631ab3c45f478480ba";
const gitBlob = crypto.createHash("sha1").update("blob " + raw.length + "\0").update(raw).digest("hex");
const contract = JSON.parse(raw.toString("utf8"));

test("pins byte-identical common-source editor contract (Git blob SHA)",()=>{
  assert.equal(gitBlob,SHA);
  assert.equal(contract.version,1);
  assert.equal(contract.compilerSnapshot.lexerBlobSha,"bba9e091c0ad1c9b75e0c61e9dd173fcc18a236a");
  assert.match(contract.status,/NOT parser or backend acceptance/);
});
for(const fixture of contract.fixtures) {
  test("shared lexical fixture: " + fixture.id,()=>{
    const tokens = defaultHighlighter.tokenize(fixture.source,"oreslang");
    assert.equal(tokens.map(x=>x.value).join(""),fixture.source,"source preserved");
    const has = expected=>tokens.some(t=>t.kind===expected.kind && t.value===expected.value);
    for(const expected of fixture.expected) {
      if(expected.kind==="plain") {
        assert.ok(!tokens.some(t=>t.kind!=="plain" && t.value===expected.value),fixture.id+": "+expected.value);
      } else {
        assert.ok(has(expected),fixture.id+": "+expected.kind+" "+expected.value);
      }
    }
    for(const forbidden of fixture.forbidden||[]) {
      assert.ok(!has(forbidden),fixture.id+": leaked "+forbidden.value);
    }
  });
}
