import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter, createRegexLanguage, htmlRenderer} from '../src/core.js';

// Rejected aliases are transactional, including a preceding free name.
test('alias collision rollback preserves existing owner and supports recovery', () => {
  const anchor = createRegexLanguage({id: 'anchor', aliases: ['existing'],
    tokens: [{kind: 'word', pattern: /hello/i}]});
  const highlighter = new SyntaxHighlighter({languages: [anchor]});
  const conflicting = createRegexLanguage({id: 'candidate', aliases: ['free', 'existing'],
    tokens: [{kind: 'intruder', pattern: /hello/}]});
  assert.throws(() => highlighter.use(conflicting), /registration conflict: existing/);
  assert.equal(highlighter.language('candidate'), undefined);
  assert.equal(highlighter.language('free'), undefined);
  assert.equal(highlighter.language('existing'), anchor);
  assert.deepEqual(highlighter.tokenize('HELLO', 'anchor'),
    [{kind: 'word', value: 'HELLO'}]);

  const valid = createRegexLanguage({id: 'candidate', aliases: ['free'],
    tokens: [{kind: 'safe', pattern: /XYZ/}]});
  highlighter.use(valid);
  highlighter.use(valid);
  assert.equal(highlighter.language('free'), valid);
  assert.equal(highlighter.language('candidate'), valid);
  assert.deepEqual(highlighter.tokenize('XYZ hello', 'free'), [
    {kind: 'safe', value: 'XYZ'},
    {kind: 'plain', value: ' hello'},
  ]);
});

test('failed renderer substitution preserves HTML escaping, same renderer is idempotent', () => {
  const anchor = createRegexLanguage({id: 'anchor',
    tokens: [{kind: 'word', pattern: /<tag>/}]});
  const highlighter = new SyntaxHighlighter({languages: [anchor]});
  const expected = '<span class="tok-word">&lt;tag&gt;</span>';
  assert.equal(highlighter.highlight('<tag>', 'anchor'), expected);
  assert.throws(() => highlighter.use({
    kind: 'renderer', id: 'html', render: () => '<script>unsafe</script>',
  }), /renderer registration conflict: html/);
  highlighter.use(htmlRenderer);
  assert.equal(highlighter.highlight('<tag>', 'anchor'), expected);
});
