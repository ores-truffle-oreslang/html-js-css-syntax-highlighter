import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

test('registration snapshots caller rule category, RegExp cursor and aliases', () => {
  const pattern = /猫/giu;
  pattern.lastIndex = 7;
  const aliases = ['wave6207-alias'];
  const rules = [{ kind: 'cat', pattern }];
  const language = createRegexLanguage({
    id: 'wave6207-registry',
    aliases,
    tokens: rules,
  });
  const engine = new SyntaxHighlighter({ languages: [language] });
  const input = '😀猫猫';
  const before = engine.tokenize(input, 'wave6207-alias');
  assert.deepEqual(before, [
    { kind: 'plain', value: '😀' },
    { kind: 'cat', value: '猫' },
    { kind: 'cat', value: '猫' },
  ]);
  rules[0].kind = 'untrusted';
  rules[0].pattern = /😀/u;
  rules.push({ kind: 'emoji', pattern: /😀/u });
  aliases[0] = 'fake-alias';
  aliases.push('new-alias');
  pattern.lastIndex = 0;
  for (let round = 0; round < 6; round++) {
    assert.deepEqual(engine.tokenize(input, 'wave6207-registry'), before);
    assert.deepEqual(engine.tokenize(input, 'wave6207-alias'), before);
    assert.throws(() => engine.tokenize(input, 'fake-alias'), /unknown language/);
    assert.throws(() => engine.tokenize(input, 'new-alias'), /unknown language/);
  }
  assert.equal(pattern.lastIndex, 0);
});

test('a later returned token mutation cannot poison the compiled rules', () => {
  const grammar = createRegexLanguage({
    id: 'wave6207-fresh-records',
    tokens: [{ kind: 'word', pattern: /abc/u }],
  });
  const first = grammar.tokenize('abc abc');
  first[0].kind = 'forged';
  first[0].value = '<script>';
  first.push({ kind: 'forged', value: 'extra' });
  assert.deepEqual(grammar.tokenize('abc abc'), [
    { kind: 'word', value: 'abc' },
    { kind: 'plain', value: ' ' },
    { kind: 'word', value: 'abc' },
  ]);
});
