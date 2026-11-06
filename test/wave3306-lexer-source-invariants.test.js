import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

// Bounded host-side tokenizer invariants; not an AttoLang guest execution test.
test('compiled scanner preserves case flags, Unicode and CRLF without cursor contamination', () => {
  const caller = /\breturn\b/gi;
  caller.lastIndex = 111;
  const rules = [
    {kind:'keyword',pattern:caller},
    {kind:'emoji',pattern:/💠/u},
    {kind:'newline',pattern:/\r\n/},
    {kind:'letter',pattern:/x/},
    {kind:'probe',pattern:/(?=x)/},
  ];
  const lang = createRegexLanguage({id:'wave3306-lexer',tokens:rules});
  rules[0].kind = 'spoofed';
  const cases = [
    ['💠RETURN\r\nx!💠return', ['emoji','keyword','newline','letter','plain','emoji','keyword']],
    ['return💠', ['keyword','emoji']],
    ['\r\n💠\r\n', ['newline','emoji','newline']],
    ['plain', ['plain']],
    ['', []],
  ];
  for (let n=0;n<15;n++) {
    for (const [src,kinds] of cases) {
      const tokens=lang.tokenize(src);
      assert.deepEqual(tokens.map(t=>t.kind),kinds);
      assert.equal(tokens.map(t=>t.value).join(''),src);
      assert.ok(tokens.every(t=>t.value.length>0));
    }
    assert.equal(caller.lastIndex,111);
  }
});
