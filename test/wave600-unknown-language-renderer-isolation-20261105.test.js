import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

test('unknown language rejects without exposing source to a custom renderer', () => {
  let invocations = 0;
  let observed = null;
  const renderer = {
    kind: 'renderer',
    id: 'wave600-probe',
    render(tokens, options) {
      invocations++;
      observed = { tokens, options };
      return tokens.map(t => t.value).join('');
    },
  };
  const language = createRegexLanguage({
    id: 'wave600-known',
    tokens: [{ kind: 'value', pattern: /known/ }],
  });
  const highlighter = new SyntaxHighlighter({
    languages: [language],
    renderers: [renderer],
  });

  for (let i = 0; i < 8; i++) {
    assert.throws(() => highlighter.highlight('<untrusted>known', 'wave600-absent',
      { renderer: 'wave600-probe' }), /unknown language/);
    assert.equal(invocations, 0);
    assert.equal(observed, null);
  }
  const options = { renderer: 'wave600-probe', key: 'expected' };
  assert.equal(highlighter.highlight('<untrusted>known', 'wave600-known', options),
    '<untrusted>known');
  assert.equal(invocations, 1);
  assert.equal(observed.options, options);
  assert.deepEqual(observed.tokens, [
    { kind: 'plain', value: '<untrusted>' },
    { kind: 'value', value: 'known' },
  ]);
});
