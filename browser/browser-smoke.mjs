import assert from "node:assert/strict";
import { chromium } from "playwright";
import { highlight } from "../src/index.js";

const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage();
  const source = 'const x = "<script>globalThis.__oreExecuted=1</script><img src=x onerror=globalThis.__oreExecuted=2>"; return #ready;';
  const html = highlight(source, "oreslang");
  await page.setContent('<!doctype html><meta charset="utf-8"><pre><code>' + html + '</code></pre>');
  assert.equal(await page.$eval("code", el => el.textContent),source,"rendered text must conserve the untrusted code");
  assert.equal(await page.locator("script, img").count(),0,"source text became active HTML");
  assert.equal(await page.evaluate(() => globalThis.__oreExecuted),undefined,"untrusted text executed a script");
  assert.ok(await page.locator("span.tok-symbol").count() >= 1,"Symbol highlighting missing");

  const maliciousPrefix = 'tok-" onmouseover="globalThis.__oreExecuted=3" bad="';
  const source2 = 'return #ready;';
  const html2 = highlight(source2, "oreslang", {classPrefix:maliciousPrefix});
  await page.setContent('<!doctype html><pre><code>' + html2 + '</code></pre>');
  assert.equal(await page.$eval("code",el=>el.textContent),source2);
  assert.equal(await page.locator("[onmouseover]").count(),0,"unsafe class prefix created active attribute");
  assert.equal(await page.evaluate(()=>globalThis.__oreExecuted),undefined);
  console.log("Chromium browser smoke passed: untrusted Oreslang markup remains inert");
} finally {
  await browser.close();
}
