// Host-only HTML renderer regression; not browser or compiler certification.
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer, SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

test('repeated hostile HTML rendering escapes every class and leaves tokens untouched', () => {
  const tokens = [
    { kind: 'quote"bad', value: '"<&\'🙂' },
    { kind: 'plain', value: '<&' },
    { kind: 'upper', value: 'x' },
  ];
  const original = structuredClone(tokens);
  const options = { classPrefix: 'pre<&' };
  const expected = '<span class="pre&lt;&amp;quote&quot;bad">&quot;&lt;&amp;&#039;🙂</span>' +
    '&lt;&amp;<span class="pre&lt;&amp;upper">x</span>';
  for (let i = 0; i < 3; i++) {
    assert.equal(htmlRenderer.render(tokens, options), expected);
    assert.deepEqual(tokens, original);
  }
});

test('custom renderer token mutation does not contaminate later highlighter calls', () => {
  const language = createRegexLanguage({
    id: 'wave47-immutable-render', tokens: [{ kind: 'word', pattern: /foo/ }]
  });
  const renderer = {
    kind: 'renderer', id: 'wave47-mutate',
    render(tokens) {
      const first = tokens[0].value;
      tokens[0].value = 'mutated';
      tokens.push({ kind: 'poison', value: 'extra' });
      return first;
    }
  };
  const highlighter = new SyntaxHighlighter({
    languages: [language], renderers: [renderer]
  });
  assert.equal(highlighter.highlight('foo', language.id, { renderer: renderer.id }), 'foo');
  assert.equal(highlighter.highlight('foo', language.id, { renderer: renderer.id }), 'foo');
  assert.deepEqual(highlighter.tokenize('foo', language.id), [{ kind: 'word', value: 'foo' }]);
});
