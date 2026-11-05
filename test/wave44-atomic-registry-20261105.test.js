// Host language-registry transaction regression; no compiler guest parity claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

const original = createRegexLanguage({
  id: 'wave44-original',
  aliases: ['wave44-short'],
  tokens: [{ kind: 'keyword', pattern: /foo/u }],
});
const impersonator = createRegexLanguage({
  id: 'wave44-impostor',
  aliases: ['wave44-new-alias', 'wave44-short'],
  tokens: [{ kind: 'keyword', pattern: /bar/u }],
});

test('late alias collision leaves no partial registration behind', () => {
  const highlighter = new SyntaxHighlighter();
  highlighter.use(original);
  assert.throws(() => highlighter.use(impersonator), /registration conflict/);
  assert.equal(highlighter.language('wave44-original'), original);
  assert.equal(highlighter.language('wave44-short'), original);
  assert.equal(highlighter.language('wave44-impostor'), undefined);
  assert.equal(highlighter.language('wave44-new-alias'), undefined);
});

test('re-registering the original instance remains idempotent after collision', () => {
  const highlighter = new SyntaxHighlighter({ languages: [original] });
  assert.throws(() => highlighter.use(impersonator), /registration conflict/);
  highlighter.use(original);
  assert.equal(highlighter.language('wave44-short'), original);
  assert.equal(highlighter.language('wave44-impostor'), undefined);
});
