// Host-only independent rule flag and renderer reuse regression.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage, escapeHtml } from '../src/core.js';

test('regex flags remain per-rule and reused highlighter never leaks scanner state', () => {
  const caseInsensitive = /hello/gi;
  const dotAll = /a.b/s;
  const strict = /a.b/;
  const lang = createRegexLanguage({id: 'wave2053-flags', aliases: ['wave2053-alias'], tokens: [
    {kind: 'strict', pattern: strict},
    {kind: 'dotall', pattern: dotAll},
    {kind: 'word', pattern: caseInsensitive},
    {kind: 'anchored', pattern: /^Z/m},
  ]});
  const highlighter = new SyntaxHighlighter({languages: [lang]});
  const cases = [
    'a\nb <&" hello HELLO\nZ a-b',
    'HELLO',
    '',
    'a-b\na\nb',
    '<&"\r\na\nb HELLO',
  ];
  const first = highlighter.tokenize(cases[0], 'wave2053-alias');
  assert.ok(first.some(t => t.kind === 'dotall' && t.value === 'a\nb'));
  assert.ok(first.some(t => t.kind === 'strict' && t.value === 'a-b'));
  assert.deepEqual(first.filter(t => t.kind === 'word').map(t => t.value), ['hello', 'HELLO']);
  assert.ok(first.some(t => t.kind === 'anchored' && t.value === 'Z'));

  for (const source of [...cases, ...cases.slice().reverse(), ...cases]) {
    caseInsensitive.lastIndex = 300;
    dotAll.lastIndex = 123;
    strict.lastIndex = 42;
    const tokens = highlighter.tokenize(source, 'wave2053-alias');
    assert.equal(tokens.map(t => t.value).join(''), source, JSON.stringify(source));
    assert.ok(tokens.every(t => t.value.length > 0), JSON.stringify(source));
    const html = highlighter.highlight(source, 'wave2053-flags');
    assert.equal(html.replace(/<span class="tok-[^"]*">|<\/span>/g, ''), escapeHtml(source));
    assert.equal(caseInsensitive.lastIndex, 300);
    assert.equal(dotAll.lastIndex, 123);
    assert.equal(strict.lastIndex, 42);
  }
});
