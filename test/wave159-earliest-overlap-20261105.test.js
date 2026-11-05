// Host-only deterministic scanner selection; not an AttoLang guest assertion.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('leftmost source span wins over earlier-registered but later matching rule', () => {
  const grammar = createRegexLanguage({ id: 'wave159-overlap', tokens: [
    { kind: 'late-b', pattern: /b/ },
    { kind: 'pair', pattern: /ab/ },
    { kind: 'single', pattern: /a/ },
    { kind: 'emoji', pattern: /\u{1f4a1}/u },
  ]});
  const source = '💡ab💡a';
  const expected = [
    { kind: 'emoji', value: '💡' },
    { kind: 'pair', value: 'ab' },
    { kind: 'emoji', value: '💡' },
    { kind: 'single', value: 'a' },
  ];
  assert.deepEqual(grammar.tokenize(source), expected);
  assert.deepEqual(grammar.tokenize(source), expected);
  assert.equal(grammar.tokenize(source).map(token => token.value).join(''), source);
});

test('rule declaration order breaks same-offset matching ties consistently', () => {
  const grammar = createRegexLanguage({ id: 'wave159-equal-offset', tokens: [
    { kind: 'first', pattern: /ab/ },
    { kind: 'second', pattern: /a/ },
  ]});
  assert.deepEqual(grammar.tokenize('ab'), [{ kind: 'first', value: 'ab' }]);
});
