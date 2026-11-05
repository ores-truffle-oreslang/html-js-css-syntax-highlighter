// Host-only independently registered grammar and source-owned regex isolation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

test('one source regex compiles into private state for distinct language instances', () => {
  const shared = /up/i;
  shared.lastIndex = 13;
  const aliases = ['wave84-secondary'];
  const tokens = [
    { kind: 'exact', pattern: /UP/ },
    { kind: 'folded', pattern: shared },
  ];
  const first = createRegexLanguage({ id: 'wave84-primary', aliases, tokens });
  const second = createRegexLanguage({
    id: 'wave84-other',
    tokens: [{ kind: 'word', pattern: /up/i }],
  });
  aliases.push('wave84-after-construction');
  tokens[0] = { kind: 'mutated', pattern: /something/ };
  shared.lastIndex = 13;

  const highlighter = new SyntaxHighlighter({ languages: [first, second] });
  assert.equal(highlighter.language('wave84-secondary'), first);
  assert.equal(highlighter.language('wave84-after-construction'), undefined);

  for (let i = 0; i < 12; i += 1) {
    assert.deepEqual(highlighter.tokenize('up UP', 'wave84-primary'), [
      { kind: 'folded', value: 'up' },
      { kind: 'plain', value: ' ' },
      { kind: 'exact', value: 'UP' },
    ]);
    assert.deepEqual(highlighter.tokenize('up UP', 'wave84-other'), [
      { kind: 'word', value: 'up' },
      { kind: 'plain', value: ' ' },
      { kind: 'word', value: 'UP' },
    ]);
  }
  assert.equal(shared.lastIndex, 13);
});
