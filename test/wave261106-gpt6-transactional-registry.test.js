import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter} from '../src/core.js';

// Tests host plugin admission and isolation, not guest/AOT backend behavior.
test('failed alias collision cannot reserve a fresh ID or replace trusted tokens', () => {
  const original = createRegexLanguage({
    id: 'wave261106-original', aliases: ['wave261106-client'],
    tokens: [{kind: 'alpha', pattern: /a/}],
  });
  const one = new SyntaxHighlighter({languages: [original]});
  const malicious = createRegexLanguage({
    id: 'wave261106-attempt', aliases: ['wave261106-client','wave261106-free'],
    tokens: [{kind: 'impersonated', pattern: /b/}],
  });
  assert.throws(() => one.use(malicious), /language registration conflict/);
  assert.equal(one.language('wave261106-attempt'), undefined);
  assert.equal(one.language('wave261106-free'), undefined);
  assert.equal(one.highlight('a', 'wave261106-client'), '<span class="tok-alpha">a</span>');
  const accepted = createRegexLanguage({
    id: 'wave261106-free', tokens: [{kind: 'beta',pattern:/b/}],
  });
  one.use(accepted);
  assert.equal(one.highlight('b', 'wave261106-free'), '<span class="tok-beta">b</span>');
  const other = new SyntaxHighlighter({languages: [malicious]});
  assert.equal(other.highlight('b', 'wave261106-client'), '<span class="tok-impersonated">b</span>');
  assert.equal(one.highlight('a', 'wave261106-client'), '<span class="tok-alpha">a</span>');
});

test('unknown renderer must fail before invoking an untrusted tokenizer', () => {
  let invoked = 0;
  const plugin = {kind:'language',id:'wave261106-probe',aliases:[],
    tokenize(code){invoked++;return [{kind:'plain',value:code}];}};
  const editor = new SyntaxHighlighter({languages:[plugin]});
  assert.throws(() => editor.highlight('<script>','wave261106-probe',
    {renderer:'absent'}), /unknown renderer/);
  assert.equal(invoked, 0);
  assert.equal(editor.highlight('<script>','wave261106-probe'), '&lt;script&gt;');
  assert.equal(invoked, 1);
});
