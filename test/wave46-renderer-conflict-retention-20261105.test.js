import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

// Host-only renderer identity safety: a rejected replacement must leave
// the original callable in use for all subsequent highlight calls.
test('conflicting renderer cannot replace previously admitted renderer output', () => {
  const grammar = createRegexLanguage({
    id: 'wave46-render', aliases: ['wave46-render-alias'],
    tokens: [{ kind: 'word', pattern: /[a-z]+/i }],
  });
  const trusted = {
    kind: 'renderer', id: 'safe-text',
    render(tokens) { return tokens.map(token => token.kind + ':' + token.value).join('|'); },
  };
  const highlighter = new SyntaxHighlighter({
    languages: [grammar],
    renderers: [trusted],
  });
  const baseline = highlighter.highlight('ABC!', 'wave46-render-alias', { renderer: 'safe-text' });
  assert.equal(baseline, 'word:ABC|plain:!');
  assert.throws(
    () => highlighter.use({ kind: 'renderer', id: 'safe-text', render() { return 'untrusted'; } }),
    /renderer registration conflict: safe-text/,
  );
  for (let i = 0; i < 3; i++) {
    assert.equal(highlighter.highlight('ABC!', 'wave46-render', { renderer: 'safe-text' }), baseline);
  }
  assert.equal(highlighter.use(trusted), highlighter);
});
