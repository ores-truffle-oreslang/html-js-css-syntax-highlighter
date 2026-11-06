import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter} from '../src/core.js';

test('prototype-like language IDs and aliases remain ordinary registry keys', () => {
  const original = createRegexLanguage({
    id: '__proto__', aliases: ['constructor', 'toString'],
    tokens: [{kind: 'keyword', pattern: /x/}]
  });
  const renderer = {
    kind: 'renderer', id: 'constructor',
    render(tokens) { return tokens.map(t => t.kind + ':' + t.value).join('|'); }
  };
  const first = new SyntaxHighlighter({languages: [original], renderers: [renderer]});
  assert.equal(first.language('__proto__'), original);
  assert.equal(first.language('constructor'), original);
  assert.equal(first.language('toString'), original);
  assert.equal(first.highlight('x!', 'constructor', {renderer:'constructor'}),
    'keyword:x|plain:!');
  assert.equal(first.use(original), first, 'idempotent registration is permitted');

  const forged = createRegexLanguage({
    id: 'foreign', aliases: ['constructor'],
    tokens: [{kind:'foreign', pattern: /!/}]
  });
  assert.throws(() => first.use(forged), /registration conflict/);
  assert.equal(first.language('foreign'), undefined,
    'failed registration must not install even the nonconflicting primary ID');
  assert.equal(first.highlight('x!', '__proto__', {renderer:'constructor'}),
    'keyword:x|plain:!');

  const second = new SyntaxHighlighter({
    languages: [forged], renderers: [renderer]
  });
  assert.equal(second.language('constructor'), forged);
  assert.equal(second.language('__proto__'), undefined);
  assert.equal({}.polluted, undefined, 'host Object prototype remains unmodified');
});
