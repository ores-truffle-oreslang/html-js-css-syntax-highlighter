// Isolated plugin registration and rendering tests, not native guest execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

test('conflicting alias is atomic and later renderer recovery preserves original language', () => {
  const language = createRegexLanguage({
    id: 'wave1710-primary',
    aliases: ['wave1710-atto', 'wave1710-legacy'],
    tokens: [
      { kind: 'tag', pattern: /<tag>/u },
      { kind: 'entity', pattern: /&/u },
    ],
  });
  const highlighter = new SyntaxHighlighter({ languages: [language] });
  const expectedHtml = '<span class="tok-tag">&lt;tag&gt;</span><span class="tok-entity">&amp;</span>';
  for (const id of ['wave1710-primary', 'wave1710-atto', 'wave1710-legacy']) {
    assert.equal(highlighter.highlight('<tag>&', id), expectedHtml);
  }
  const attempted = {
    kind: 'language',
    id: 'wave1710-shadow',
    aliases: ['wave1710-atto'],
    tokenize() { throw new Error('shadow tokenizer must never run'); },
  };
  assert.throws(() => highlighter.use(attempted), /registration conflict/);
  assert.equal(highlighter.language('wave1710-shadow'), undefined);
  assert.throws(() => highlighter.highlight('<tag>&', 'wave1710-primary',
    { renderer: 'missing-wave1710' }), /unknown renderer/);

  highlighter.use({
    kind: 'renderer',
    id: 'wave1710-raw',
    render(tokens) { return tokens.map(token => token.value).join(''); },
  });
  assert.equal(highlighter.highlight('<tag>&', 'wave1710-legacy',
    { renderer: 'wave1710-raw' }), '<tag>&');
  assert.equal(highlighter.highlight('<tag>&', 'wave1710-primary'), expectedHtml);
});
