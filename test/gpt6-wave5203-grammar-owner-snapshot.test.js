import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter} from '../src/core.js';

// Host lexer ownership proof only; no AttoLang guest or native compiler execution.
test('compiled grammar snapshots caller-owned RegExp, aliases and token categories', () => {
  const callerPattern = /x/gy;
  callerPattern.lastIndex = 73;
  const aliases = ['wave5203-owner-alias'];
  const tokens = [
    {kind: 'letter', pattern: callerPattern},
    {kind: 'fruit', pattern: /🍊/u},
  ];
  const language = createRegexLanguage({id: 'wave5203-owner', aliases, tokens});
  const highlighter = new SyntaxHighlighter({languages: [language]});
  const text = 'x🍊x\r\nx';
  const expected = [
    ['letter', 'x'], ['fruit', '🍊'], ['letter', 'x'],
    ['plain', '\r\n'], ['letter', 'x'],
  ];

  assert.equal(highlighter.language('wave5203-owner-alias'), language);
  for (let round = 0; round < 4; round++) {
    assert.deepEqual(language.tokenize(text).map(t => [t.kind, t.value]), expected);
    assert.equal(language.tokenize(text).map(t => t.value).join(''), text);
    assert.equal(callerPattern.lastIndex, 73);
  }

  // Mutating the caller's rule graph cannot reconfigure a registered grammar.
  aliases[0] = 'untrusted-replacement';
  tokens[0].kind = 'injected';
  tokens[0].pattern = /z/g;
  tokens[1].kind = 'rewritten';
  tokens.push({kind: 'bad', pattern: /x/g});
  callerPattern.lastIndex = 917;
  assert.equal(highlighter.language('wave5203-owner-alias'), language);
  assert.equal(highlighter.language('untrusted-replacement'), undefined);
  for (const value of [text, '🍊x', 'x🍊']) {
    const out = highlighter.tokenize(value, 'wave5203-owner-alias');
    assert.equal(out.map(t => t.value).join(''), value);
    assert.ok(out.every(t => t.kind !== 'injected' && t.kind !== 'rewritten' && t.kind !== 'bad'));
  }
  assert.deepEqual(language.tokenize(text).map(t => [t.kind, t.value]), expected);
  assert.equal(callerPattern.lastIndex, 917);
});
