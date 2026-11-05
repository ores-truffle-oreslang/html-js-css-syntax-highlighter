// Source-owned Unicode registry identity regression; no language guest execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

test('composed and decomposed Unicode IDs and aliases are distinct', () => {
  const nfc = 'caf\u00e9';
  const nfd = 'cafe\u0301';
  assert.notEqual(nfc, nfd);
  const first = createRegexLanguage({
    id: nfc, aliases: ['alias/' + nfc],
    tokens: [{ kind: 'composed', pattern: /task/ }],
  });
  const second = createRegexLanguage({
    id: nfd, aliases: ['alias/' + nfd],
    tokens: [{ kind: 'decomposed', pattern: /task/ }],
  });
  const highlighter = new SyntaxHighlighter({ languages: [first, second] });

  for (const name of [nfc, 'alias/' + nfc]) {
    assert.equal(highlighter.language(name), first);
    assert.equal(highlighter.highlight('task', name), '<span class="tok-composed">task</span>');
  }
  for (const name of [nfd, 'alias/' + nfd]) {
    assert.equal(highlighter.language(name), second);
    assert.equal(highlighter.highlight('task', name), '<span class="tok-decomposed">task</span>');
  }
  assert.throws(() => highlighter.highlight('task', nfc.toUpperCase()), /unknown language/);
  assert.throws(() => highlighter.highlight('task', 'alias/' + nfc.toUpperCase()), /unknown language/);
});
