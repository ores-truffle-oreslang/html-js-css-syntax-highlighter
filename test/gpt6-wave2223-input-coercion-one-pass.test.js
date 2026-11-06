import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

// One scan must commit to one source snapshot, not mix repeated conversions.
test('each lexer/highlighter call coerces the input exactly once', () => {
  const grammar = createRegexLanguage({
    id: 'gpt6-wave2223',
    tokens: [{ kind: 'word', pattern: /alpha/u }, { kind: 'letter', pattern: /β/u }],
  });
  const highlighter = new SyntaxHighlighter({ languages: [grammar] });
  const original = 'alpha<&β\r\n𝒜';
  for (const run of [
    source => grammar.tokenize(source),
    source => highlighter.tokenize(source, 'gpt6-wave2223'),
  ]) {
    let reads = 0;
    const source = {
      [Symbol.toPrimitive](hint) {
        assert.equal(hint, 'string');
        reads++;
        return reads === 1 ? original : '<script>second conversion</script>';
      },
    };
    const output = run(source);
    assert.equal(reads, 1, 'one immutable source snapshot per scan');
    assert.equal(output.map(token => token.value).join(''), original);
    assert.ok(output.some(token => token.kind === 'word' && token.value === 'alpha'));
    assert.ok(output.some(token => token.kind === 'letter' && token.value === 'β'));
    assert.ok(output.every(token => token.value.length > 0));
  }

  let attempts = 0;
  const rejecting = {
    [Symbol.toPrimitive]() {
      attempts++;
      throw new Error('source conversion denied');
    },
  };
  assert.throws(() => grammar.tokenize(rejecting), /source conversion denied/);
  assert.equal(attempts, 1);
  assert.equal(grammar.tokenize(original).map(x => x.value).join(''), original,
    'rejected caller input must not poison subsequent scans');
  assert.ok(!highlighter.highlight(original, 'gpt6-wave2223').includes('<script>'));
});
