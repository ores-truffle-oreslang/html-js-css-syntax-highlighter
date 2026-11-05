// Source-owned atomic registration and HTML boundary regression.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

test('failed alias registration cannot poison a later valid independent language', () => {
  const trusted = createRegexLanguage({
    id: 'trusted', aliases: ['t'],
    tokens: [{ kind: 'word', pattern: /x/ }],
  });
  const instance = new SyntaxHighlighter({ languages: [trusted] });
  assert.throws(() => instance.use({
    kind: 'language', id: 'candidate', aliases: ['t'],
    tokenize(code) { return [{ kind: 'forged', value: code }]; },
  }), /language registration conflict/);
  assert.equal(instance.language('candidate'), undefined);
  assert.equal(instance.language('t'), trusted);

  const valid = createRegexLanguage({
    id: 'candidate', aliases: ['c'],
    tokens: [{ kind: 'word', pattern: /x/ }],
  });
  instance.use(valid);
  assert.equal(instance.language('c'), valid);
  assert.equal(instance.language('t'), trusted);
  assert.equal(instance.highlight('x<&', 'c'),
    '<span class="tok-word">x</span>&lt;&amp;');
  assert.equal(instance.highlight('x<&', 't'),
    '<span class="tok-word">x</span>&lt;&amp;');
  assert.equal(instance.highlight('x<&', 'c'),
    instance.highlight('x<&', 't'));
});
