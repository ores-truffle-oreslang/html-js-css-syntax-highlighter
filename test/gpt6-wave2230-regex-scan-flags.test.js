import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/core.js';

// Verify per-rule flags, tie precedence and source conservation independently.
test('per-rule ignoreCase and dotAll do not leak into neighboring rules', () => {
  const insensitive = /alpha/ig;
  const multiline = /BEGIN.*END/s;
  insensitive.lastIndex = 3;
  multiline.lastIndex = 2;
  const language = createRegexLanguage({
    id: 'mixed-flags',
    tokens: [
      {kind:'casefold', pattern:insensitive},
      {kind:'multiline',pattern:multiline},
      {kind:'caseSensitive',pattern:/ALPHA/},
      {kind:'literal',pattern:/beta/},
    ],
  });
  const source = 'ALPHA\r\nBEGIN\nxEND beta BETA alpha';
  const expected = [
    ['casefold','ALPHA'],
    ['multiline','BEGIN\nxEND'],
    ['literal','beta'],
    ['casefold','alpha'],
  ];
  for (let i=0;i<8;i++) {
    const tokens=language.tokenize(source);
    assert.equal(tokens.map(x=>x.value).join(''),source);
    assert.deepEqual(tokens.filter(x=>x.kind!=='plain').map(x=>[x.kind,x.value]),expected);
    assert.equal(insensitive.lastIndex,3);
    assert.equal(multiline.lastIndex,2);
    assert.equal(new SyntaxHighlighter({languages:[language]}).tokenize(source,'mixed-flags')
      .map(x=>x.value).join(''),source);
  }
});

test('tied leftmost matches preserve earlier rule declaration order', () => {
  const lang=createRegexLanguage({
    id:'tie-priority',
    tokens:[{kind:'first',pattern:/x/i},{kind:'second',pattern:/X/}],
  });
  assert.deepEqual(lang.tokenize('X x').filter(t=>t.kind!=='plain')
    .map(t=>t.kind),['first','first']);
});
