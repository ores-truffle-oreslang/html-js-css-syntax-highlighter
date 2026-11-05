import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

// Host API conformance: no compiled AttoLang guest or native runtime claim.
test('mutated caller-owned regexes/rules cannot alter a registered scanner', () => {
  const callerRegex = /ab/gi;
  callerRegex.lastIndex = 8;
  const aliases = ['batch5-alias'];
  const tokens = [
    { kind: 'word', pattern: callerRegex },
    { kind: 'glyph', pattern: /💠/u },
    { kind: 'newline', pattern: /\r\n/ },
  ];
  const grammar = createRegexLanguage({
    id: 'batch5-snapshot', aliases, tokens,
  });
  const highlighter = new SyntaxHighlighter({ languages: [grammar] });
  const source = 'ab💠xAB\r\nab';
  const expected = [
    {kind:'word', value:'ab'},
    {kind:'glyph', value:'💠'},
    {kind:'plain', value:'x'},
    {kind:'word', value:'AB'},
    {kind:'newline', value:'\r\n'},
    {kind:'word', value:'ab'},
  ];
  callerRegex.lastIndex = 99;
  aliases[0] = 'untrusted-replacement';
  tokens[0].kind = 'forged';
  tokens[0].pattern = /zzz/;
  tokens.push({kind:'late',pattern:/x/});

  assert.deepEqual(grammar.aliases, ['batch5-alias']);
  assert.equal(highlighter.language('batch5-alias'), grammar);
  assert.equal(highlighter.language('untrusted-replacement'), undefined);
  for (let iteration = 0; iteration < 9; iteration++) {
    assert.deepEqual(highlighter.tokenize(source, 'batch5-alias'), expected);
    assert.equal(callerRegex.lastIndex, 99);
  }
});

test('cross-input reuse preserves empty/plain boundaries after nonempty token runs', () => {
  const scanner = createRegexLanguage({id:'batch5-independent-inputs',tokens:[
    {kind:'word',pattern:/ab/i},
  ]});
  const cases = ['', 'ab', 'zz', '💠ab💠', 'AB\nab'];
  for (let repetition=0; repetition<5; repetition++) {
    for (const input of cases) {
      const output=scanner.tokenize(input);
      assert.equal(output.map(part=>part.value).join(''), input);
      assert.ok(output.every(part=>part.value.length>0));
      if (input === '') assert.deepEqual(output, []);
      if (input === 'zz') assert.deepEqual(output, [{kind:'plain',value:'zz'}]);
    }
  }
});
