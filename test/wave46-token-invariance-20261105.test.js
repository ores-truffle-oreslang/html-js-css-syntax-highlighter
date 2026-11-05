import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

test('registered alias keys are not altered by later mutation of exposed grammar aliases', () => {
  const language = createRegexLanguage({
    id: 'wave46-original',
    aliases: ['wave46-stable'],
    tokens: [{ kind: 'word', pattern: /yes/ }],
  });
  const highlighter = new SyntaxHighlighter({ languages: [language] });
  assert.equal(highlighter.language('wave46-original'), language);
  assert.equal(highlighter.language('wave46-stable'), language);

  language.aliases[0] = 'wave46-impersonator';
  language.aliases.push('wave46-late');
  assert.equal(highlighter.language('wave46-original'), language);
  assert.equal(highlighter.language('wave46-stable'), language);
  assert.equal(highlighter.language('wave46-impersonator'), undefined);
  assert.equal(highlighter.language('wave46-late'), undefined);
  assert.deepEqual(highlighter.tokenize('yes!', 'wave46-stable'), [
    { kind: 'word', value: 'yes' }, { kind: 'plain', value: '!' },
  ]);
});
