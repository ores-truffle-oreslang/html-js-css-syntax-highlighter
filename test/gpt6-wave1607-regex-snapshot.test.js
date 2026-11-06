import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/index.js';

test('registered grammar snapshots caller rules, flags, aliases, and regex cursor', () => {
  const callerRegex = /END/gi;
  callerRegex.lastIndex = 17;
  const originalRule = { kind: 'stable', pattern: callerRegex };
  const aliasNames = ['stable-alias'];
  const lang = createRegexLanguage({
    id: 'wave1607-snapshot', aliases: aliasNames, tokens: [originalRule]
  });
  const highlighter = new SyntaxHighlighter({ languages: [lang] });

  originalRule.kind = 'corrupted';
  originalRule.pattern = /PWN/;
  aliasNames[0] = 'changed-alias';
  callerRegex.lastIndex = 23;

  const tokens = highlighter.tokenize('end PWN END', 'stable-alias');
  assert.deepEqual(tokens, [
    { kind: 'stable', value: 'end' },
    { kind: 'plain', value: ' PWN ' },
    { kind: 'stable', value: 'END' }
  ]);
  assert.equal(highlighter.language('changed-alias'), undefined);
  assert.equal(highlighter.language('stable-alias'), lang);
  assert.equal(callerRegex.lastIndex, 23);
  assert.equal(highlighter.highlight('End', 'stable-alias'),
    '<span class="tok-stable">End</span>');
  assert.equal(callerRegex.lastIndex, 23);
});

test('single-rule failure does not silently claim a nonmatching substring', () => {
  const callerRegex = /strict/;
  const lang = createRegexLanguage({
    id: 'wave1607-case',
    tokens: [{ kind: 'lowercase', pattern: callerRegex }]
  });
  const h = new SyntaxHighlighter({ languages: [lang] });
  assert.deepEqual(h.tokenize('STRICT strict strictness', lang.id), [
    { kind: 'plain', value: 'STRICT ' },
    { kind: 'lowercase', value: 'strict' },
    { kind: 'plain', value: ' ' },
    { kind: 'lowercase', value: 'strict' },
    { kind: 'plain', value: 'ness' }
  ]);
});
