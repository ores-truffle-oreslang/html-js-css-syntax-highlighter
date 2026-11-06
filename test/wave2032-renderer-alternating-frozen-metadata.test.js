import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlRenderer, SyntaxHighlighter, createRegexLanguage } from '../src/core.js';

// Independent literal expected HTML, not derived from the escape implementation.
test('alternating frozen token sets cannot retain the previous class prefix', () => {
  const a = Object.freeze([
    Object.freeze({kind: 'plain', value: '💠<&'}),
    Object.freeze({kind: 'id', value: 'é"'}),
  ]);
  const b = Object.freeze([
    Object.freeze({kind: 'danger" onclick="run', value: "'<&"}),
    Object.freeze({kind: 'plain', value: '\0💠'}),
  ]);
  const first = '💠&lt;&amp;<span class="tok-id">é&quot;</span>';
  const second = '<span class="q&quot; data-z=&quot;&lt;danger&quot; onclick=&quot;run">&#039;&lt;&amp;</span>\0💠';
  for (let index = 0; index < 12; index++) {
    assert.equal(htmlRenderer.render(a), first);
    assert.equal(htmlRenderer.render(b,{classPrefix: 'q" data-z="<'}), second);
    assert.equal(htmlRenderer.render(a), first);
    assert.equal(a[0].value, '💠<&');
    assert.equal(b[0].kind, 'danger" onclick="run');
  }
});

test('highlighter renderer options are call-local across alternating Unicode sources', () => {
  const language = createRegexLanguage({id: 'wave2032-inline',tokens: [{kind:'mark',pattern:/💠/u}]});
  const highlighter = new SyntaxHighlighter({languages:[language]});
  for (let i=0;i<6;i++) {
    assert.equal(highlighter.highlight('💠<',language.id,{classPrefix:'x"'}), '<span class="x&quot;mark">💠</span>&lt;');
    assert.equal(highlighter.highlight('&💠',language.id), '&amp;<span class="tok-mark">💠</span>');
  }
});
