// Host-only language registration regression; no guest/compiler claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

test('registration retains original alias and token meaning after caller mutation', () => {
  const aliases = ['wave47-short'];
  const token = { kind: 'word', pattern: /foo/ };
  const grammar = createRegexLanguage({
    id: 'wave47-full', aliases, tokens: [token]
  });
  const highlighter = new SyntaxHighlighter({ languages: [grammar] });
  assert.equal(highlighter.language('wave47-short'), grammar);
  const expected = [
    { kind: 'word', value: 'foo' },
    { kind: 'plain', value: ' bar' }
  ];
  assert.deepEqual(highlighter.tokenize('foo bar', 'wave47-short'), expected);
  aliases[0] = 'forged-alias';
  grammar.aliases[0] = 'rebound-alias';
  token.kind = 'malicious';
  token.pattern = /bar/;
  assert.equal(highlighter.language('wave47-short'), grammar);
  assert.equal(highlighter.language('forged-alias'), undefined);
  assert.equal(highlighter.language('rebound-alias'), undefined);
  assert.deepEqual(highlighter.tokenize('foo bar', 'wave47-short'), expected);
});

test('conflicting alias cannot partially register a second language id', () => {
  const original = createRegexLanguage({
    id: 'wave47-owner', aliases: ['wave47-held'],
    tokens: [{ kind: 'first', pattern: /foo/ }]
  });
  const attempted = createRegexLanguage({
    id: 'wave47-new-id', aliases: ['wave47-held'],
    tokens: [{ kind: 'second', pattern: /bar/ }]
  });
  const highlighter = new SyntaxHighlighter({ languages: [original] });
  assert.throws(() => highlighter.use(attempted), /language registration conflict/);
  assert.equal(highlighter.language('wave47-held'), original);
  assert.equal(highlighter.language('wave47-new-id'), undefined);
  assert.deepEqual(highlighter.tokenize('foo', 'wave47-held'),
    [{ kind: 'first', value: 'foo' }]);
});
