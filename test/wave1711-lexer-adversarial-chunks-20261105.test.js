// End-to-end source conservation across alternating short/long Unicode inputs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage, escapeHtml } from '../src/core.js';

test('repeated highlighter scans conserve Unicode and escaped HTML without stale matches', () => {
  const supplied = /ab/gy;
  const language = createRegexLanguage({id: 'wave1711-source', tokens: [
    {kind: 'pair', pattern: supplied},
    {kind: 'emoji', pattern: /😀/gu},
    {kind: 'newline', pattern: /\r\n/gu},
    {kind: 'single', pattern: /a/gu},
  ]});
  const highlighter = new SyntaxHighlighter({languages: [language]});
  const units = ['ab', 'a', '😀', '\r\n', '<&"', '\0'];
  const values = ['', 'ab😀\r\n<&"\0', 'a', '😀'];
  let layer = [''];
  for (let width = 1; width <= 3; width++) {
    layer = layer.flatMap(prefix => units.map(unit => prefix + unit));
    values.push(...layer);
  }
  assert.equal(values.length, 262);
  for (const value of values) {
    supplied.lastIndex = 97;
    const first = highlighter.tokenize(value, 'wave1711-source');
    assert.equal(first.map(token => token.value).join(''), value, JSON.stringify(value));
    assert.ok(first.every(token => token.value.length > 0), JSON.stringify(value));
    const rendered = highlighter.highlight(value, 'wave1711-source');
    assert.equal(rendered.replace(/<span class="tok-[^"]*">|<\/span>/g, ''), escapeHtml(value));
    supplied.lastIndex = 0;
    assert.deepEqual(highlighter.tokenize(value, 'wave1711-source'), first);
  }
  assert.equal(supplied.lastIndex, 0, 'compiled grammar does not mutate caller regex state');
});
