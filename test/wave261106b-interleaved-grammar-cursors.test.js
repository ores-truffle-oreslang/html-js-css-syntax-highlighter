// Host lexer contract: internal pattern cursors are independent per language.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

test('interleaved grammars sharing a caller RegExp never leak matching state', () => {
  const shared = /foo/gi;
  const first = createRegexLanguage({ id: 'wave261106b-first',
    tokens: [{kind: 'first', pattern: shared}] });
  const second = createRegexLanguage({ id: 'wave261106b-second',
    tokens: [{kind: 'second', pattern: shared}] });
  const highlighter = new SyntaxHighlighter({languages: [first, second]});
  const source = 'foo FOO 🌿foo';
  const values = ['foo', ' ', 'FOO', ' 🌿', 'foo'];
  const firstKinds = ['first', 'plain', 'first', 'plain', 'first'];
  const secondKinds = ['second', 'plain', 'second', 'plain', 'second'];
  for (let i=0; i<4; i++) {
    shared.lastIndex = i + 1;
    for (const [lang, kinds] of [
      [first.id, firstKinds], [second.id, secondKinds],
    ]) {
      const tokens = highlighter.tokenize(source, lang);
      assert.deepEqual(tokens.map(x => x.value), values);
      assert.deepEqual(tokens.map(x => x.kind), kinds);
      assert.equal(tokens.map(x => x.value).join(''), source);
    }
    assert.equal(shared.lastIndex, i + 1);
  }
});
