import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultHighlighter} from '../src/index.js';

const escapeIndependent = value => Array.from(value).map(ch => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
})[ch] ?? ch).join('');

test('built-in HTML, CSS and JS aliases conserve source in escaped DOM', () => {
  const cases = [
    {primary:'html', alias:'htm', source:'<!DOCTYPE html><div data-x="<&">🙂<!-- hidden --></div>'},
    {primary:'javascript', alias:'typescript', source:'const value = "<script>🙂<&</script>";\r\n// <img onerror=1>\nvalue;'},
    {primary:'javascript', alias:'mjs', source:'const λ = "<svg onload=1>🔥&";'},
    {primary:'css', alias:null, source:'@media screen { .safe:before { content:"<script>🙂&"; color:#abc; } }\r\n'},
  ];
  for (const entry of cases) {
    const languages = entry.alias ? [entry.primary, entry.alias] : [entry.primary];
    for (const language of languages) {
      const tokens = defaultHighlighter.tokenize(entry.source, language);
      assert.equal(tokens.map(t => t.value).join(''), entry.source, language+' source conservation');
      const rendered = defaultHighlighter.highlight(entry.source, language);
      const text = rendered.replace(/<span class="[^"]*">|<\/span>/g, '');
      assert.equal(text, escapeIndependent(entry.source), language+' escaped DOM text');
      assert.equal(rendered.includes('<script>'), false, 'untrusted script markup must never render raw');
      assert.equal(rendered.includes('<svg '), false, 'untrusted svg markup must never render raw');
      assert.equal(defaultHighlighter.highlight(entry.source, language), rendered);
    }
  }
});

test('three built-in languages keep categories and source isolated when interleaved', () => {
  const samples = [
    ['javascript','const thing = "<a>&</a>";\r\n// #fff','keyword'],
    ['html','<b data-x="true">&copy;</b>\n','tag'],
    ['css','.card { color: #abc; }\n','property'],
  ];
  for (let pass=0; pass<12; pass++) {
    for(const [language,source,kind] of samples) {
      const items=defaultHighlighter.tokenize(source,language);
      assert.equal(items.map(x=>x.value).join(''),source);
      assert.ok(items.some(x=>x.kind===kind),language+' expected '+kind);
    }
  }
});
