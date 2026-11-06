import test from 'node:test';
import assert from 'node:assert/strict';
import { createRegexLanguage, SyntaxHighlighter } from '../src/index.js';

test('prototype-shaped IDs remain independent trusted language registry entries', () => {
  const names = ['__proto__', 'constructor', 'toString', 'hasOwnProperty'];
  const langs = names.map((id, i) => createRegexLanguage({
    id, aliases: ['safe-alias-' + i],
    tokens: [{ kind: 'safe', pattern: /TOKEN/ }]
  }));
  const h = new SyntaxHighlighter({ languages: langs });
  for (let i = 0; i < names.length; i++) {
    assert.equal(h.language(names[i]), langs[i]);
    assert.equal(h.language('safe-alias-' + i), langs[i]);
    assert.equal(h.highlight('TOKEN', names[i]), '<span class="tok-safe">TOKEN</span>');
  }
  assert.equal(h.language('missing'), undefined);
  const attacker = createRegexLanguage({
    id: 'unrelated', aliases: ['nonexistent-alias', 'constructor'],
    tokens: [{ kind: 'unsafe', pattern: /EVIL/ }]
  });
  assert.throws(() => h.use(attacker), /language registration conflict: constructor/);
  assert.equal(h.language('unrelated'), undefined);
  assert.equal(h.language('nonexistent-alias'), undefined);
  assert.equal(h.language('constructor'), langs[1]);
});
