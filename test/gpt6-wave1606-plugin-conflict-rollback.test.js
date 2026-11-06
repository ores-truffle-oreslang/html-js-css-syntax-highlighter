import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/index.js';

test('failed alias collision registers no partial names and permits clean recovery', () => {
  const initial = createRegexLanguage({
    id: 'first', aliases: ['protected'], tokens: [{ kind: 'safe', pattern: /SAFE/ }]
  });
  const conflicting = createRegexLanguage({
    id: 'second', aliases: ['transient', 'protected'],
    tokens: [{ kind: 'unsafe', pattern: /EVIL/ }]
  });
  const highlighter = new SyntaxHighlighter({ languages: [initial] });
  assert.throws(() => highlighter.use(conflicting), /language registration conflict: protected/);
  assert.equal(highlighter.language('protected'), initial);
  assert.equal(highlighter.language('transient'), undefined);
  assert.equal(highlighter.language('second'), undefined);
  const recovered = createRegexLanguage({
    id: 'second', aliases: ['transient'], tokens: [{ kind: 'safe', pattern: /OK/ }]
  });
  highlighter.use(recovered);
  assert.equal(highlighter.language('second'), recovered);
  assert.equal(highlighter.language('transient'), recovered);
  assert.equal(highlighter.highlight('SAFE', 'protected'), '<span class="tok-safe">SAFE</span>');
  assert.equal(highlighter.highlight('OK', 'transient'), '<span class="tok-safe">OK</span>');
});

test('renderer ID conflicts preserve original rendering and reject hostile class prefix', () => {
  const lang = createRegexLanguage({ id: 'scope', tokens: [{ kind: 'x', pattern: /value/ }] });
  const original = { kind: 'renderer', id: 'custom', render: () => 'original' };
  const h = new SyntaxHighlighter({ languages: [lang], renderers: [original] });
  assert.throws(
    () => h.use({ kind: 'renderer', id: 'custom', render: () => 'injected' }),
    /renderer registration conflict: custom/
  );
  assert.equal(h.highlight('value', 'scope', { renderer: 'custom' }), 'original');
  h.use({ kind: 'renderer', id: 'html',
    render: (tokens) => tokens.map(t => t.value).join('') });
  assert.equal(h.highlight('value', 'scope'), 'value');
});
