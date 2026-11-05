import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter, createRegexLanguage} from '../src/core.js';

// Source-owned JS admission coverage; unknown renderer must not invoke a plugin.
test('unknown renderers are denied before untrusted tokenizer execution', () => {
  let tokenizations = 0;
  const untrusted = {
    kind: 'language',
    id: 'wave181207-untrusted',
    aliases: [],
    tokenize() {
      tokenizations++;
      throw new Error('untrusted language callback executed');
    },
  };
  const highlighter = new SyntaxHighlighter({languages: [untrusted]});
  for (let n = 0; n < 5; n++) {
    assert.throws(
      () => highlighter.highlight('<script>', untrusted.id, {renderer: 'unknown-renderer'}),
      /unknown renderer/
    );
    assert.equal(tokenizations, 0);
  }
});

test('registered renderer receives tokens and selected options exactly once', () => {
  const language = createRegexLanguage({
    id: 'wave181207-known',
    tokens: [{kind: 'letter', pattern: /x/}],
  });
  const calls = [];
  const renderer = {
    kind: 'renderer',
    id: 'wave181207-probe',
    render(tokens, options) {
      calls.push({tokens, guard: options.guard});
      return tokens.map(token => token.value).join('') + '|' + options.guard;
    },
  };
  const highlighter = new SyntaxHighlighter({languages: [language], renderers: [renderer]});
  assert.equal(highlighter.highlight('xy', language.id, {
    renderer: renderer.id, guard: 'verified',
  }), 'xy|verified');
  assert.deepEqual(calls, [{tokens: [
    {kind: 'letter', value: 'x'}, {kind: 'plain', value: 'y'},
  ], guard: 'verified'}]);
});
