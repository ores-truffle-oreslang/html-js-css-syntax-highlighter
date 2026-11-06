import test from 'node:test';
import assert from 'node:assert/strict';
import {oreslang} from '../src/plugins/oreslang.js';

// Host lexer stress for opacity across comment/string/Symbol boundaries.
const tick = String.fromCharCode(96);
const template = tick + 'return /* fake */ $' + '{if}' + tick;
const cases = [
  {
    source: '/* outer return /* nested if */ more return */\nfnc valid() {}',
    opaque: '/* outer return /* nested if */ more return */',
    kind: 'comment', following: 'fnc',
  },
  {
    source: template + '\nreturn',
    opaque: template,
    kind: 'string', following: 'return',
  },
  {
    source: '#"return /* comment */ <script>"\nfnc valid() {}',
    opaque: '#"return /* comment */ <script>"',
    kind: 'symbol', following: 'fnc',
  },
  {
    source: '// return /* nested */ if\r\nfnc valid() {}',
    opaque: '// return /* nested */ if\r',
    kind: 'comment', following: 'fnc',
  },
  {
    source: '"return // not comment"\nreturn',
    opaque: '"return // not comment"',
    kind: 'string', following: 'return',
  },
];

test('interleaved opaque lexical bodies never promote inner keywords', () => {
  for (let round = 0; round < 24; round++) {
    for (const {source, opaque, kind, following} of cases) {
      const tokens = oreslang.tokenize(source);
      assert.equal(tokens[0].kind, kind, source);
      assert.equal(tokens[0].value, opaque);
      assert.equal(tokens.map(token => token.value).join(''), source);
      assert.equal(tokens.filter(token => token.kind === 'keyword').length, 1);
      assert.ok(tokens.some(token => token.kind === 'keyword'
        && token.value === following));
      assert.ok(tokens.every(token => token.value.length > 0));
    }
  }
});

test('unterminated nested comment retains all bytes without keyword leakage', () => {
  const source = '/* outer return /* inner if */ still unterminated fnc';
  const tokens = oreslang.tokenize(source);
  assert.deepEqual(tokens, [{kind: 'comment', value: source}]);
});
