import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage} from '../src/core.js';

// Source-owned lexer contract: caller RegExp state cannot escape into compilation.
test('alternating Unicode/CRLF lexers never mutate source RegExp or lose bytes', () => {
  const callerRegex = /x/gy;
  callerRegex.lastIndex = 54321;
  const language = createRegexLanguage({
    id: 'wave303006-snap',
    tokens: [
      {kind: 'x', pattern: callerRegex},
      {kind: 'gem', pattern: /💠/u},
      {kind: 'newline', pattern: /\r\n/},
    ],
  });
  const cases = [
    ['💠x\r\nx!', [
      ['gem','💠'], ['x','x'], ['newline','\r\n'],
      ['x','x'], ['plain','!'],
    ]],
    ['x💠xx', [['x','x'], ['gem','💠'], ['x','x'], ['x','x']]],
    ['plain', [['plain','plain']]],
    ['x', [['x','x']]],
    ['💠\r\n', [['gem','💠'], ['newline','\r\n']]],
  ];
  for (let pass = 0; pass < 6; pass++) {
    for (const [source, expected] of cases) {
      const tokens = language.tokenize(source);
      assert.deepEqual(tokens.map(t => [t.kind, t.value]), expected);
      assert.equal(tokens.map(t => t.value).join(''), source);
      assert.ok(tokens.every(t => t.value.length > 0));
      assert.equal(callerRegex.lastIndex, 54321);
    }
  }
});
