// Source-owned tokenizer and regex snapshot tests; not compiler guest parity.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('sequential scans conserve mixed astral, CRLF, and marked text exactly', () => {
  const marker = /#[a-z]+/g;
  marker.lastIndex = 4;
  const language = createRegexLanguage({
    id: 'wave95-partition',
    tokens: [
      { kind: 'empty', pattern: /(?:)/u },
      { kind: 'marker', pattern: marker },
      { kind: 'cat', pattern: /🐈/u },
    ],
  });
  const source = '😀#one\r\n🐈#two\n😺';
  const original = language.tokenize(source);
  assert.equal(original.map(token => token.value).join(''), source);
  assert.ok(original.every(token => token.value.length > 0));
  assert.deepEqual(original.filter(token => token.kind === 'marker').map(token => token.value),
    ['#one', '#two']);
  assert.equal(marker.lastIndex, 4, 'caller RegExp cursor remains owned by caller');
  for (let n = 0; n < 8; n++) {
    assert.deepEqual(language.tokenize(source), original);
    assert.equal(marker.lastIndex, 4);
  }
});

test('caller mutation of one token array cannot poison later scans', () => {
  const language = createRegexLanguage({
    id: 'wave95-fresh-result',
    tokens: [{ kind: 'word', pattern: /猫/u }],
  });
  const source = '😺猫\r\n猫😀';
  const expected = language.tokenize(source);
  const first = language.tokenize(source);
  first[0].value = 'tampered';
  first.push({ kind: 'fake', value: 'extra' });
  assert.deepEqual(language.tokenize(source), expected);
  assert.equal(language.tokenize(source).map(token => token.value).join(''), source);
});
