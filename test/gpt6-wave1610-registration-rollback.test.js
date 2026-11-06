import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/index.js';

test('conflicting language alias fails transactionally without claiming earlier free aliases', () => {
  const original = createRegexLanguage({
    id: 'wave1610-original',
    aliases: ['wave1610-shared', 'constructor'],
    tokens: [{kind: 'word', pattern: /Alpha/}]
  });
  const highlighter = new SyntaxHighlighter({languages: [original]});
  const before = highlighter.highlight('Alpha', original.id);
  let untrustedCalls = 0;
  const collision = {
    kind: 'language', id: 'wave1610-intruder',
    aliases: ['wave1610-free', 'wave1610-shared'],
    tokenize() { untrustedCalls++; throw Error('never invoke untrusted tokenizer'); }
  };
  assert.throws(() => highlighter.use(collision), /language registration conflict/);
  assert.equal(untrustedCalls, 0);
  assert.equal(highlighter.language(collision.id), undefined);
  assert.equal(highlighter.language('wave1610-free'), undefined);
  assert.equal(highlighter.language('wave1610-shared'), original);
  assert.equal(highlighter.language('constructor'), original);
  assert.equal(highlighter.highlight('Alpha', original.id), before);
  assert.deepEqual(highlighter.tokenize('Alpha', original.id),
    [{kind:'word', value:'Alpha'}]);
  highlighter.use(original);
  assert.equal(highlighter.language('wave1610-shared'), original);
});

test('conflicting renderer cannot replace the previously registered HTML renderer', () => {
  const original = createRegexLanguage({
    id: 'wave1610-renderer-owner', tokens: [{kind:'keyword', pattern:/return/}]
  });
  const highlighter = new SyntaxHighlighter({languages:[original]});
  const before = highlighter.highlight('return <&', original.id);
  let attacks = 0;
  assert.throws(() => highlighter.use({
    kind:'renderer', id:'html',
    render() { attacks++; return '<script>unsafe</script>'; }
  }), /renderer registration conflict/);
  assert.equal(attacks, 0);
  assert.equal(highlighter.highlight('return <&', original.id), before);
  assert.ok(before.includes('&lt;&amp;'));
});