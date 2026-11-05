import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter, createRegexLanguage} from '../src/core.js';

// Host-side renderer identity tests; no compiler-backed guest claim.
test('a conflicting HTML renderer cannot override a previously trusted renderer', () => {
  const language = createRegexLanguage({
    id: 'wave46-renderer', aliases: ['wave46-alias'],
    tokens: [{kind: 'word', pattern: /[a-z]+/u}],
  });
  const highlighter = new SyntaxHighlighter({languages: [language]});
  const expected = '<span class="tok-word">safe</span> &amp;';
  assert.equal(highlighter.highlight('safe &', 'wave46-alias'), expected);

  assert.throws(() => highlighter.use({
    kind: 'renderer', id: 'html',
    render: () => '<script>untrusted</script>',
  }), /renderer registration conflict: html/);

  assert.equal(highlighter.highlight('safe &', 'wave46-renderer'), expected);
  assert.equal(highlighter.highlight('safe &', 'wave46-alias'), expected);
});

test('same-object custom renderer reuse is idempotent; a different owner is refused', () => {
  const language = createRegexLanguage({id: 'wave46-plain', tokens: [{kind: 'number', pattern: /[0-9]+/u}]});
  const highlighter = new SyntaxHighlighter({languages: [language]});
  const renderer = {
    kind: 'renderer', id: 'wave46-custom',
    render: tokens => tokens.map(token => token.kind + ':' + token.value).join('|'),
  };
  highlighter.use(renderer);
  highlighter.use(renderer);
  assert.equal(highlighter.highlight('a12', 'wave46-plain', {renderer: renderer.id}), 'plain:a|number:12');
  assert.throws(() => highlighter.use({...renderer}), /renderer registration conflict: wave46-custom/);
  assert.equal(highlighter.highlight('a12', 'wave46-plain', {renderer: renderer.id}), 'plain:a|number:12');
});
