// Host-only registry transaction/recovery regression; no guest compiler claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter, createRegexLanguage} from '../src/core.js';

test('late alias collision cannot reserve earlier names or prevent a repaired registration', () => {
  const trusted = createRegexLanguage({id: 'trusted', aliases: ['trusted-alt'], tokens: [
    {kind: 'keyword', pattern: /trusted/},
  ]});
  const highlighter = new SyntaxHighlighter({languages: [trusted]});
  const impersonator = createRegexLanguage({
    id: 'pending', aliases: ['fresh-alt', 'trusted-alt'],
    tokens: [{kind: 'keyword', pattern: /untrusted/}],
  });
  assert.throws(() => highlighter.use(impersonator),
    /language registration conflict: trusted-alt/);
  assert.equal(highlighter.language('pending'), undefined);
  assert.equal(highlighter.language('fresh-alt'), undefined);
  assert.equal(highlighter.language('trusted-alt'), trusted);

  const repaired = createRegexLanguage({
    id: 'pending', aliases: ['fresh-alt'],
    tokens: [{kind: 'keyword', pattern: /approved/}],
  });
  assert.equal(highlighter.use(repaired), highlighter);
  assert.equal(highlighter.use(repaired), highlighter);
  assert.equal(highlighter.language('pending'), repaired);
  assert.equal(highlighter.language('fresh-alt'), repaired);
  assert.equal(highlighter.language('trusted-alt'), trusted);
  assert.equal(highlighter.tokenize('approved', 'fresh-alt')[0].value, 'approved');
});
