// Host integration: invalid render choices must not execute an untrusted language callback.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter } from '../src/core.js';

test('unknown renderer fails before executing language tokenization', () => {
  let executions = 0;
  const grammar = {
    kind: 'language',
    id: 'wave330-probe',
    aliases: ['wave330-alias'],
    tokenize(code) {
      executions += 1;
      return [{ kind: 'plain', value: code }];
    },
  };
  const highlighter = new SyntaxHighlighter({ languages: [grammar] });
  for (const languageId of [grammar.id, grammar.aliases[0]]) {
    assert.throws(() => highlighter.highlight('<script>', languageId,
      { renderer: 'missing-wave330-renderer' }), /unknown renderer/);
  }
  assert.equal(executions, 0);
  assert.equal(highlighter.highlight('<script>', grammar.id), '&lt;script&gt;');
  assert.equal(executions, 1);
});

test('registered custom renderer receives one private tokenization result', () => {
  let executions = 0;
  const highlighter = new SyntaxHighlighter({ languages: [{
    kind: 'language', id: 'wave330-active',
    tokenize(code) {
      executions += 1;
      return [{ kind: 'sample', value: code }];
    },
  }] });
  highlighter.use({
    kind: 'renderer', id: 'wave330-text',
    render(tokens) { return tokens.map(token => token.kind + ':' + token.value).join('|'); },
  });
  assert.equal(highlighter.highlight('hello', 'wave330-active', { renderer: 'wave330-text' }),
    'sample:hello');
  assert.equal(executions, 1);
});
