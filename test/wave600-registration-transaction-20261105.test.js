import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

test('conflicting alias rejection must be atomic and retain the original grammar', () => {
  const original = createRegexLanguage({
    id: 'wave600-original',
    aliases: ['wave600-shared'],
    tokens: [{ kind: 'original', pattern: /origin/ }],
  });
  const highlighter = new SyntaxHighlighter({ languages: [original] });
  const conflicting = createRegexLanguage({
    id: 'wave600-new',
    aliases: ['wave600-free', 'wave600-shared'],
    tokens: [{ kind: 'bad', pattern: /origin/ }],
  });

  assert.throws(() => highlighter.use(conflicting), /registration conflict/);
  assert.equal(highlighter.language('wave600-new'), undefined);
  assert.equal(highlighter.language('wave600-free'), undefined);
  assert.equal(highlighter.language('wave600-shared'), original);
  assert.equal(highlighter.highlight('origin', 'wave600-shared'),
    '<span class="tok-original">origin</span>');

  const accepted = createRegexLanguage({
    id: 'wave600-new',
    aliases: ['wave600-free'],
    tokens: [{ kind: 'accepted', pattern: /origin/ }],
  });
  assert.equal(highlighter.use(accepted), highlighter);
  assert.equal(highlighter.language('wave600-free'), accepted);
  assert.equal(highlighter.highlight('origin', 'wave600-new'),
    '<span class="tok-accepted">origin</span>');
  assert.equal(highlighter.language('wave600-shared'), original);
});
