// Source-owned host regression: renderer ID admission is fail-closed and atomic.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

test('conflicting renderer cannot replace an already registered renderer', () => {
  const lang = createRegexLanguage({
    id: 'wave45-renderer-ownership',
    tokens: [{ kind: 'token', pattern: /ok/ }],
  });
  const highlighter = new SyntaxHighlighter({ languages: [lang] });
  const trusted = {
    kind: 'renderer', id: 'wave45-format',
    render(tokens) { return tokens.map(token => '[' + token.kind + ':' + token.value + ']').join(''); },
  };
  highlighter.use(trusted);
  assert.equal(highlighter.highlight('ok!', lang.id, { renderer: trusted.id }), '[token:ok][plain:!]');

  assert.throws(() => highlighter.use({
    kind: 'renderer', id: trusted.id, render: () => 'untrusted',
  }), /renderer registration conflict/);
  assert.equal(highlighter.highlight('ok!', lang.id, { renderer: trusted.id }), '[token:ok][plain:!]');
  assert.equal(highlighter.highlight('ok', lang.id), '<span class="tok-token">ok</span>');
});

test('malformed renderer cannot register a dangling renderer identity', () => {
  const highlighter = new SyntaxHighlighter();
  assert.throws(() => highlighter.use({
    kind: 'renderer', id: 'wave45-invalid-renderer', render: 'not-a-function',
  }), /must provide render/);
  const language = createRegexLanguage({
    id: 'wave45-renderer-valid-language', tokens: [{ kind: 'kw', pattern: /ok/ }],
  });
  highlighter.use(language);
  assert.throws(() => highlighter.highlight('ok', language.id, { renderer: 'wave45-invalid-renderer' }),
    /unknown renderer/);
  assert.equal(highlighter.highlight('ok', language.id), '<span class="tok-kw">ok</span>');
});
