import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage } from '../src/core.js';

test('compiled grammar category is immutable against later caller rule mutation', () => {
  const first = { pattern: /foo/, kind: 'keyword' };
  const second = { pattern: /bar/ };
  const language = createRegexLanguage({id: 'snapshot', tokens: [first, second]});
  first.kind = 'untrusted';
  first.pattern = /zzz/;
  second.kind = 'untrusted';
  second.pattern = /xxx/;
  assert.deepEqual(language.tokenize('foo bar'), [
    {kind: 'keyword', value: 'foo'},
    {kind: 'plain', value: ' '},
    {kind: 'plain', value: 'bar'},
  ]);
});
