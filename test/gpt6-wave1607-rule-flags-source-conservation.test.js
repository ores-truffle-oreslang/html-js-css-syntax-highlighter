import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/index.js';

test('per-rule ignoreCase and dotAll flags preserve source boundaries', () => {
  const casePattern = /flag/gi;
  const multilinePattern = /a.b/gs;
  casePattern.lastIndex = 17;
  multilinePattern.lastIndex = 29;
  const lang = createRegexLanguage({
    id: 'gpt6-wave1607-flags',
    tokens: [
      {kind: 'case', pattern: casePattern},
      {kind: 'across', pattern: multilinePattern}
    ]
  });
  const h = new SyntaxHighlighter({languages: [lang]});
  const source = 'FlAg a\nb\r\nFLAG a\rb\r\nFLAG x';
  for (let i = 0; i < 15; i++) {
    const tokens = h.tokenize(source, lang.id);
    assert.equal(tokens.map(t => t.value).join(''), source);
    assert.deepEqual(tokens.filter(t => t.kind === 'case').map(t => t.value),
      ['FlAg', 'FLAG', 'FLAG']);
    assert.deepEqual(tokens.filter(t => t.kind === 'across').map(t => t.value),
      ['a\nb', 'a\rb']);
    assert.ok(tokens.every(t => t.value.length > 0));
    assert.equal(casePattern.lastIndex, 17);
    assert.equal(multilinePattern.lastIndex, 29);
  }
  assert.equal(h.highlight('<&', lang.id), '&lt;&amp;');
});
