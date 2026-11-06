// Source-owned plugin registration transaction tests. No compiler guest proof.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

const grammar = (id, aliases, word) => createRegexLanguage({
  id, aliases, tokens: [{ kind: 'hit', pattern: new RegExp(word) }],
});

test('a later colliding alias rolls back every new name atomically', () => {
  const base = grammar('wave2391-base', ['wave2391-common'], 'base');
  const highlighter = new SyntaxHighlighter({ languages: [base] });
  const before = highlighter.tokenize('base next', 'wave2391-common');
  const conflicting = grammar('wave2391-new', [
    'wave2391-unclaimed', 'wave2391-common'
  ], 'next');

  for (let attempt = 0; attempt < 9; attempt++) {
    assert.throws(
      () => highlighter.use(conflicting),
      /language registration conflict: wave2391-common/
    );
    assert.equal(highlighter.language('wave2391-new'), undefined);
    assert.equal(highlighter.language('wave2391-unclaimed'), undefined);
    assert.equal(highlighter.language('wave2391-common'), base);
    assert.deepEqual(highlighter.tokenize('base next', 'wave2391-base'), before);
  }

  const replacement = grammar('wave2391-new', ['wave2391-unclaimed'], 'next');
  assert.equal(highlighter.use(replacement), highlighter);
  assert.equal(highlighter.language('wave2391-unclaimed'), replacement);
  assert.deepEqual(highlighter.tokenize('base next', 'wave2391-unclaimed'), [
    { kind: 'plain', value: 'base ' }, { kind: 'hit', value: 'next' },
  ]);
  assert.deepEqual(highlighter.tokenize('base next', 'wave2391-common'), before);
});

test('a rejected renderer overwrite cannot replace a trusted HTML renderer', () => {
  const base = grammar('wave2391-render-language', [], 'return');
  const highlighter = new SyntaxHighlighter({ languages: [base] });
  let unsafeCalls = 0;
  const unsafe = {
    kind: 'renderer', id: 'html', render() {
      unsafeCalls++;
      return '<script>alert(1)</script>';
    }
  };
  const source = '<return>&"';
  const before = highlighter.highlight(source, base.id);
  for (let attempt = 0; attempt < 8; attempt++) {
    assert.throws(() => highlighter.use(unsafe),
      /renderer registration conflict: html/);
    assert.equal(highlighter.highlight(source, base.id), before);
  }
  assert.equal(unsafeCalls, 0);
  assert.ok(before.includes('&lt;'));
  assert.ok(!before.includes('<script>'));
});

test('conflicting primary language ID cannot claim previously unused aliases', () => {
  const base = grammar('wave2391-primary', [], 'base');
  const highlighter = new SyntaxHighlighter({ languages: [base] });
  const collision = grammar('wave2391-primary', ['wave2391-new-alias'], 'evil');
  assert.throws(() => highlighter.use(collision),
    /language registration conflict: wave2391-primary/);
  assert.equal(highlighter.language('wave2391-new-alias'), undefined);
  assert.equal(highlighter.language('wave2391-primary'), base);
});
