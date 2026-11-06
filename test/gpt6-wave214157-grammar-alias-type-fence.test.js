import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter} from '../src/core.js';

// Regression against accidentally admitting iterable/string aliases as independent IDs.
test('grammar constructors require dense arrays of nonempty string aliases', () => {
  const rule = [{kind:'letter',pattern:/x/}];
  const bad = [
    'aliases', new Set(['alias']), {0:'alias',length:1},
    [, 'later'], ['valid', , 'also-valid'], [''], [null], [123],
  ];
  for (const aliases of bad) {
    assert.throws(() => createRegexLanguage({
      id:'wave214157', aliases, tokens:rule,
    }), TypeError);
  }
  const accepted = createRegexLanguage({
    id:'wave214157', aliases:Object.freeze(['safe','also-safe']),
    tokens:Object.freeze(rule),
  });
  assert.deepEqual(accepted.aliases,['safe','also-safe']);
  const host = new SyntaxHighlighter({languages:[accepted]});
  assert.equal(host.language('safe'),accepted);
  assert.equal(host.language('also-safe'),accepted);
  assert.equal(host.language('a'),undefined);
  assert.deepEqual(host.tokenize('x?', 'safe'),[
    {kind:'letter',value:'x'}, {kind:'plain',value:'?'},
  ]);
});
