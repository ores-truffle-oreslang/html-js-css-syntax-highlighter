import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer, SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

test('HTML renderer escapes frozen token kinds, prefixes, and source without mutating input', () => {
  const tokens = Object.freeze([
    Object.freeze({ kind: 'k" onclick="evil', value: 'a<&"\'😀' }),
    Object.freeze({ kind: 'plain', value: '&x<\r\n' }),
  ]);
  const options = Object.freeze({ classPrefix: 't&<' });
  const expected = '<span class="t&amp;&lt;k&quot; onclick=&quot;evil">a&lt;&amp;&quot;&#039;😀</span>&amp;x&lt;\r\n';
  assert.equal(htmlRenderer.render(tokens, options), expected);
  assert.equal(htmlRenderer.render(tokens, options), expected);
  assert.equal(tokens[0].kind, 'k" onclick="evil');
  assert.equal(tokens[0].value, 'a<&"\'😀');
  assert.equal(tokens[1].value, '&x<\r\n');
  assert.equal(expected.includes('<script'), false);
});

test('independent highlighters cannot cross-contaminate rendering options', () => {
  const grammar = createRegexLanguage({
    id: 'wave1290-escape',
    tokens: [{ kind: 'tag', pattern: /<x>/u }],
  });
  const a = new SyntaxHighlighter({ languages: [grammar] });
  const b = new SyntaxHighlighter({ languages: [grammar] });
  const source = '<x>&';
  assert.equal(a.highlight(source, grammar.id, { classPrefix: 'a"&' }),
    '<span class="a&quot;&amp;tag">&lt;x&gt;</span>&amp;');
  assert.equal(b.highlight(source, grammar.id),
    '<span class="tok-tag">&lt;x&gt;</span>&amp;');
});
