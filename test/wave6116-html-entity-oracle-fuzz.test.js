// Seeded independent HTML escaping oracle over untrusted public host token metadata.
import test from 'node:test';
import assert from 'node:assert/strict';
import {htmlRenderer} from '../src/core.js';

function escapeByScalar(value) {
  const entities = new Map([['&','&amp;'], ['<','&lt;'], ['>','&gt;'], ['"','&quot;'], ["'",'&#039;']]);
  return [...String(value)].map(c => entities.get(c) ?? c).join('');
}

test('seeded hostile metadata preserves immutable tokens and never escapes the escaping contract', () => {
  const alphabet = ['&', '<', '>', '"', "'", '🙂', '雪', '\r', '\n', '\0', 'x', ' ', '/', '='];
  let seed = 0x66116d32;
  const next = () => {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return seed >>> 0;
  };
  for (let sample = 0; sample < 220; sample++) {
    const pick = () => Array.from({length: 1 + next() % 15}, () => alphabet[next() % alphabet.length]).join('');
    const prefix = 'p" data-unsafe="<svg>&' + pick();
    const options = Object.freeze({classPrefix: prefix});
    const tokens = Object.freeze([
      Object.freeze({kind: 'word" onfocus="bad' + pick(), value: pick()}),
      Object.freeze({kind: 'plain', value: pick()}),
      Object.freeze({kind: 'tag', value: pick()}),
    ]);
    const snapshot = JSON.stringify(tokens);
    const oracle = tokens.map(t => t.kind === 'plain'
      ? escapeByScalar(t.value)
      : '<span class="' + escapeByScalar(prefix + t.kind) + '">' +
        escapeByScalar(t.value) + '</span>').join('');
    for (let repeat = 0; repeat < 3; repeat++) {
      const rendered = htmlRenderer.render(tokens, options);
      assert.equal(rendered, oracle, 'sample ' + sample);
      assert.equal(JSON.stringify(tokens), snapshot);
      assert.equal(rendered.includes('<svg'), false);
      assert.equal(rendered.includes(' onfocus="'), false);
    }
  }
});
