import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter} from '../src/core.js';

test('separate highlighter registries isolate identical names and failed collisions', () => {
  const first = createRegexLanguage({
    id: 'wave9861-shared', aliases: ['wave9861-short'],
    tokens: [{kind: 'alpha', pattern: /alpha/}],
  });
  const second = createRegexLanguage({
    id: 'wave9861-shared', aliases: ['wave9861-short'],
    tokens: [{kind: 'beta', pattern: /beta/}],
  });
  const a = new SyntaxHighlighter({languages: [first]});
  const b = new SyntaxHighlighter({languages: [second]});
  const text = 'alpha beta';
  const expectedA = [
    {kind: 'alpha', value: 'alpha'}, {kind: 'plain', value: ' beta'},
  ];
  const expectedB = [
    {kind: 'plain', value: 'alpha '}, {kind: 'beta', value: 'beta'},
  ];
  for (let i = 0; i < 30; i++) {
    assert.deepEqual(a.tokenize(text, 'wave9861-short'), expectedA);
    assert.deepEqual(b.tokenize(text, 'wave9861-short'), expectedB);
  }
  const conflicting = createRegexLanguage({
    id: 'wave9861-new', aliases: ['wave9861-short'],
    tokens: [{kind: 'wrong', pattern: /alpha/}],
  });
  assert.throws(() => a.use(conflicting), /registration conflict/);
  assert.equal(a.language('wave9861-new'), undefined);
  assert.strictEqual(a.language('wave9861-short'), first);
  assert.strictEqual(b.language('wave9861-short'), second);
  assert.throws(() => a.use({kind: 'renderer', id: 'html',
    render: () => '<unsafe>'}), /registration conflict/);
  assert.equal(a.highlight('<unsafe>', 'wave9861-short'), '&lt;unsafe&gt;');
  assert.equal(b.highlight('<unsafe>', 'wave9861-short'), '&lt;unsafe&gt;');
});
