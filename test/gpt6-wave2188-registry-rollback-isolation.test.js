import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

// Host JS plugin-registry contract; it does not establish AttoLang guest parity.
test('late alias conflict rejects the entire attempted registration atomically', () => {
  const original = createRegexLanguage({
    id: 'same', aliases: ['shared'],
    tokens: [{kind: 'alpha', pattern: /alpha/}],
  });
  const rival = createRegexLanguage({
    id: 'different', aliases: ['free', 'shared'],
    tokens: [{kind: 'beta', pattern: /beta/}],
  });
  const registry = new SyntaxHighlighter({languages: [original]});
  assert.throws(() => registry.use(rival), /language registration conflict: shared/);
  assert.equal(registry.language('different'), undefined);
  assert.equal(registry.language('free'), undefined);
  assert.equal(registry.language('shared'), original);
  assert.equal(registry.highlight('alpha', 'same'), '<span class="tok-alpha">alpha</span>');
  registry.use(original); // re-registering the *same* trusted instance is idempotent.
  assert.equal(registry.highlight('alpha', 'shared'), '<span class="tok-alpha">alpha</span>');
});

test('two registries with the same language ID own separate grammar identities', () => {
  const a = createRegexLanguage({id: 'shared-id', tokens:[{kind:'a',pattern:/alpha/}]});
  const b = createRegexLanguage({id: 'shared-id', tokens:[{kind:'b',pattern:/beta/}]});
  const left = new SyntaxHighlighter({languages:[a]});
  const right = new SyntaxHighlighter({languages:[b]});
  for (let i=0;i<8;i++) {
    assert.equal(left.highlight('alpha beta','shared-id'),
      '<span class="tok-a">alpha</span> beta');
    assert.equal(right.highlight('alpha beta','shared-id'),
      'alpha <span class="tok-b">beta</span>');
    assert.equal(left.language('shared-id'), a);
    assert.equal(right.language('shared-id'), b);
  }
});
