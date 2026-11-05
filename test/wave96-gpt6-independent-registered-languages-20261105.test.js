import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

test('distinct registered language aliases retain isolated token partitions', () => {
  const a = createRegexLanguage({
    id: 'wave96-alpha',
    aliases: ['wave96-a'],
    tokens: [{ kind: 'alpha', pattern: /a+/ }],
  });
  const b = createRegexLanguage({
    id: 'wave96-beta',
    aliases: ['wave96-b'],
    tokens: [{ kind: 'beta', pattern: /b+/ }],
  });
  const highlighter = new SyntaxHighlighter({ languages: [a, b] });
  const source = 'aab🙂';
  assert.equal(highlighter.language('wave96-a'), a);
  assert.equal(highlighter.language('wave96-b'), b);
  for (let i = 0; i < 12; i++) {
    assert.deepEqual(highlighter.tokenize(source, 'wave96-a'), [
      { kind: 'alpha', value: 'aa' },
      { kind: 'plain', value: 'b🙂' },
    ]);
    assert.deepEqual(highlighter.tokenize(source, 'wave96-b'), [
      { kind: 'plain', value: 'aa' },
      { kind: 'beta', value: 'b' },
      { kind: 'plain', value: '🙂' },
    ]);
    assert.equal(highlighter.highlight(source, 'wave96-a'), '<span class="tok-alpha">aa</span>b🙂');
    assert.equal(highlighter.highlight(source, 'wave96-b'), 'aa<span class="tok-beta">b</span>🙂');
  }
});
