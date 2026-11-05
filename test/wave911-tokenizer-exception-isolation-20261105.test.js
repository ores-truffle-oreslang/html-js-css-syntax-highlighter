// Host-only highlighter fault isolation; no compiler guest-execution claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter, createRegexLanguage} from '../src/core.js';

test('a third-party tokenizer exception does not poison trusted language or aliases', () => {
  const good = createRegexLanguage({id: 'trusted-wave911', aliases: ['trusted-alias'], tokens: [
    {kind: 'keyword', pattern: /return/},
  ]});
  const highlighter = new SyntaxHighlighter({languages: [good]});
  const untrusted = {kind: 'language', id: 'untrusted-wave911', tokenize() {
    throw new Error('wave911 tokenizer failure');
  }};
  highlighter.use(untrusted);
  for (let attempt = 0; attempt < 3; attempt++) {
    assert.throws(() => highlighter.highlight('anything', 'untrusted-wave911'),
      /wave911 tokenizer failure/);
    assert.deepEqual(highlighter.tokenize('return', 'trusted-alias'),
      [{kind: 'keyword', value: 'return'}]);
    assert.equal(highlighter.highlight('return', 'trusted-wave911'),
      '<span class="tok-keyword">return</span>');
  }
  assert.equal(highlighter.language('trusted-alias'), good);
});

test('an invalid language registration cannot evict a working fallback', () => {
  const good = createRegexLanguage({id: 'wave911-good', aliases: ['live'], tokens: [
    {kind: 'word', pattern: /ok/},
  ]});
  const highlighter = new SyntaxHighlighter({languages: [good]});
  assert.throws(() => highlighter.use({
    kind: 'language', id: 'wave911-bad', aliases: ['new-alias', 'live'],
    tokenize() { throw new Error('should never run'); },
  }), /registration conflict: live/);
  assert.equal(highlighter.language('wave911-bad'), undefined);
  assert.equal(highlighter.language('new-alias'), undefined);
  assert.deepEqual(highlighter.tokenize('ok', 'live'), [{kind: 'word', value: 'ok'}]);
});
