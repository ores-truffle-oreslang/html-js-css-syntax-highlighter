// Host registry atomicity regression: a failed adversarial registration
// cannot steal names, alter rendering, or obstruct later valid plug-ins.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter, htmlRenderer} from '../src/core.js';

test('conflicting alias is refused before registering an attacker-controlled id', () => {
  const trusted=createRegexLanguage({
    id:'wave771-trusted',aliases:['wave771-atto'],
    tokens:[{kind:'keyword',pattern:/ATTO/u}]
  });
  const highlighter=new SyntaxHighlighter({languages:[trusted]});
  const hostile=createRegexLanguage({
    id:'wave771-hostile',aliases:['wave771-atto'],
    tokens:[{kind:'danger',pattern:/ATTO/u}]
  });
  assert.throws(()=>highlighter.use(hostile),/language registration conflict/);
  assert.equal(highlighter.language('wave771-trusted'),trusted);
  assert.equal(highlighter.language('wave771-atto'),trusted);
  assert.equal(highlighter.language('wave771-hostile'),undefined);
  assert.equal(highlighter.highlight('ATTO','wave771-atto'),
    '<span class="tok-keyword">ATTO</span>');
  highlighter.use(trusted);
  const later=createRegexLanguage({
    id:'wave771-safe',aliases:['wave771-safe-alias'],
    tokens:[{kind:'number',pattern:/[0-9]+/u}]
  });
  highlighter.use(later);
  assert.equal(highlighter.language('wave771-safe-alias'),later);
  assert.equal(highlighter.highlight('42','wave771-safe'),
    '<span class="tok-number">42</span>');
});

test('conflicting renderer cannot displace existing HTML escaping', () => {
  const language=createRegexLanguage({
    id:'wave771-render',tokens:[{kind:'tag',pattern:/TAG/u}]
  });
  const highlighter=new SyntaxHighlighter({languages:[language]});
  assert.throws(()=>highlighter.use({
    kind:'renderer',id:'html',render:()=>'<script>forged</script>'
  }),/renderer registration conflict/);
  assert.equal(highlighter.highlight('<TAG>&','wave771-render'),
    '&lt;<span class="tok-tag">TAG</span>&gt;&amp;');
  highlighter.use(htmlRenderer);
  highlighter.use({kind:'renderer',id:'wave771-text',
    render:tokens=>tokens.map(token=>token.value).join('')});
  assert.equal(highlighter.highlight('<TAG>&','wave771-render',
    {renderer:'wave771-text'}),'<TAG>&');
  assert.equal(highlighter.highlight('<TAG>&','wave771-render'),
    '&lt;<span class="tok-tag">TAG</span>&gt;&amp;');
});
