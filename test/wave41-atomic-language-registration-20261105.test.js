// Host-only plugin registration atomicity regression.
import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter, createRegexLanguage} from '../src/core.js';

test('alias collision does not install a partially registered language ID', () => {
  const highlighter = new SyntaxHighlighter();
  const original = createRegexLanguage({
    id: 'wave41-primary', aliases: ['wave41-taken'],
    tokens: [{kind: 'word', pattern: /ok/}],
  });
  highlighter.use(original);
  const conflicting = createRegexLanguage({
    id: 'wave41-new', aliases: ['wave41-unused', 'wave41-taken'],
    tokens: [{kind: 'replacement', pattern: /evil/}],
  });
  assert.throws(() => highlighter.use(conflicting), /registration conflict/);
  assert.equal(highlighter.language('wave41-new'), undefined);
  assert.equal(highlighter.language('wave41-unused'), undefined);
  assert.equal(highlighter.language('wave41-taken'), original);
  assert.equal(highlighter.highlight('ok', 'wave41-primary'), '<span class="tok-word">ok</span>');
});

test('invalid alias elements do not install a language, and existing language remains usable', () => {
  const highlighter = new SyntaxHighlighter();
  const valid = createRegexLanguage({id: 'wave41-valid',
    tokens: [{kind: 'symbol', pattern: /#ready/}]});
  highlighter.use(valid);
  const invalid = {kind: 'language', id: 'wave41-invalid', aliases: ['valid', 7],
    tokenize: () => [{kind: 'plain', value: 'tampered'}]};
  assert.throws(() => highlighter.use(invalid), /non-empty strings/);
  assert.equal(highlighter.language('wave41-invalid'), undefined);
  assert.equal(highlighter.language('valid'), undefined);
  assert.deepEqual(highlighter.tokenize('#ready', 'wave41-valid'),
    [{kind: 'symbol', value: '#ready'}]);
});
