import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultHighlighter, highlight, escapeHtml,
  SyntaxHighlighter, oreslang, html, javascript, astro,
} from '../src/index.js';

// Public package/facade and alias contract, not a compiler-backed AttoLang test.
test('public facade aliases retain identical token streams and independently escaped HTML', () => {
  const cases = [
    ['oreslang', ['ores', 'atto', 'attolang', 'atto-lang'],
      'fnc foo() { return #"💠"; }\r\n// <script>&'],
    ['html', ['htm'], '<!DOCTYPE html>\r\n<a title="&"><b>&amp;</b></a>'],
    ['javascript', ['js', 'mjs', 'cjs', 'typescript', 'ts'],
      'const s = "<svg>&";\nreturn s;'],
    ['astro', ['astro-template'], '<div client:load title="<>&">💠</div>'],
  ];
  for (const [canonical, aliases, source] of cases) {
    const expected = defaultHighlighter.tokenize(source, canonical);
    assert.equal(expected.map(x=>x.value).join(''), source);
    const baseline = highlight(source, canonical);
    assert.ok(baseline.includes('&lt;') || baseline.includes('&amp;'), canonical);
    for (const alias of aliases) {
      assert.strictEqual(defaultHighlighter.language(alias),
        defaultHighlighter.language(canonical));
      assert.deepEqual(defaultHighlighter.tokenize(source, alias), expected);
      assert.equal(highlight(source, alias), baseline);
      assert.equal(highlight(source, alias, {classPrefix:'safe-'}),
        defaultHighlighter.highlight(source,canonical,{classPrefix:'safe-'}));
      assert.ok(!highlight(source, alias).includes('<script>'));
    }
  }
});

test('independently constructed public highlighters cannot mutate shared facade output', () => {
  const source = 'return "<>&";';
  const baseline = highlight(source, 'ores');
  const secondary = new SyntaxHighlighter({languages:[oreslang,html,javascript,astro]});
  const different = secondary.highlight(source,'oreslang',{classPrefix:'custom-'});
  assert.notEqual(different, baseline);
  assert.equal(highlight(source,'ores'),baseline);
  assert.equal(escapeHtml('<>&"\''),'&lt;&gt;&amp;&quot;&#039;');
});
