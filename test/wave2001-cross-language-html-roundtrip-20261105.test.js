import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter, createRegexLanguage} from '../src/core.js';

function escaped(s) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
test('alias-isolated grammars preserve hostile HTML and Unicode across repeated renders', () => {
  const defs = [
    {id: 'wave2001-att', alias: 'wave2001-at', kind: 'keyword', pattern: /#ready/},
    {id: 'wave2001-markup', alias: 'wave2001-mark', kind: 'tag', pattern: /script/},
    {id: 'wave2001-style', alias: 'wave2001-css', kind: 'value', pattern: /blue/},
  ];
  const languages = defs.map(d => createRegexLanguage({
    id: d.id, aliases: [d.alias], tokens: [{kind: d.kind, pattern: d.pattern}]
  }));
  const highlighter = new SyntaxHighlighter({languages});
  const source = '💠<&<script>"' + "'" + '#ready\r\nblue & 🧪 >';
  const classPrefix = 'p" tabindex="0 &<';
  for (let repeat = 0; repeat < 4; repeat++) {
    for (const [i, d] of defs.entries()) {
      assert.equal(highlighter.language(d.id), languages[i]);
      assert.equal(highlighter.language(d.alias), languages[i]);
      const tokens = highlighter.tokenize(source, d.alias);
      assert.equal(tokens.map(t => t.value).join(''), source);
      const expected = tokens.map(t => t.kind === 'plain'
        ? escaped(t.value)
        : '<span class="' + escaped(classPrefix + t.kind) + '">' + escaped(t.value) + '</span>').join('');
      const actual = highlighter.highlight(source, d.id, {classPrefix});
      assert.equal(actual, expected);
      assert.equal(highlighter.highlight(source, d.alias, {classPrefix}), expected);
      assert.ok(!actual.includes('<script>'));
      assert.ok(!actual.includes('tabindex="0'));
      assert.ok(actual.includes('💠'));
      assert.ok(actual.includes('\r\n'));
    }
  }
});
