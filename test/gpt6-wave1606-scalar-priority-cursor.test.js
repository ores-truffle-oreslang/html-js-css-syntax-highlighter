import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/index.js';

test('zero-width rules never swallow astral, CRLF or an owned RegExp cursor', () => {
  const owned = /FiX/gi;
  owned.lastIndex = 7;
  const lang = createRegexLanguage({
    id: 'gpt6-wave1606-scalar-boundary',
    tokens: [
      { kind: 'lookahead', pattern: /(?=.)/ },
      { kind: 'repair', pattern: owned }
    ]
  });
  const highlighter = new SyntaxHighlighter({ languages: [lang] });
  let seed = 0x1606a771;
  for (let n = 0; n < 128; n++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const source = '🦊'.repeat(seed % 9) + 'fIx\r\n<&"\'\u0000>' +
      '日'.repeat((seed >>> 7) % 6) + 'FIX';
    const tokens = highlighter.tokenize(source, lang.id);
    assert.equal(tokens.map(x => x.value).join(''), source, 'source roundtrip ' + n);
    assert.equal(tokens.filter(x => x.kind === 'repair').length, 2, 'match count ' + n);
    assert.ok(tokens.every(x => x.value.length > 0), 'zero-width token ' + n);
    assert.equal(owned.lastIndex, 7, 'caller RegExp cursor ' + n);
    const html = highlighter.highlight(source, lang.id);
    assert.ok(html.includes('&lt;&amp;&quot;&#039;'), 'escaped markup ' + n);
    assert.equal(owned.lastIndex, 7, 'render mutated caller RegExp cursor ' + n);
  }
});
