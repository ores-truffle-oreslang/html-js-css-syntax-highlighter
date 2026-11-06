import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter} from '../src/core.js';

test('plugin namespaces isolate equal aliases across independent highlighter instances', () => {
  const a = createRegexLanguage({id:'alpha', aliases:['shared'], tokens:[
    {kind:'one', pattern:/x/},
  ]});
  const b = createRegexLanguage({id:'beta', aliases:['shared'], tokens:[
    {kind:'two', pattern:/🌐/u},
  ]});
  const first = new SyntaxHighlighter({languages:[a]});
  const second = new SyntaxHighlighter({languages:[b]});
  const source = 'x&🌐\r\nx';
  const expectedA = '<span class="tok-one">x</span>&amp;🌐\r\n<span class="tok-one">x</span>';
  const expectedB = 'x&amp;<span class="tok-two">🌐</span>\r\nx';
  for(let n=0;n<100;n++){
    assert.equal(first.highlight(source,'shared'),expectedA);
    assert.equal(second.highlight(source,'shared'),expectedB);
    assert.equal(first.tokenize(source,'shared').map(t=>t.value).join(''),source);
    assert.equal(second.tokenize(source,'shared').map(t=>t.value).join(''),source);
  }
});

test('conflicting later aliases fail atomically without reserving earlier names', () => {
  const existing = createRegexLanguage({id:'reserved', aliases:['taken'], tokens:[
    {kind:'original',pattern:/ok/},
  ]});
  const h = new SyntaxHighlighter({languages:[existing]});
  const output = h.highlight('ok&🌐','taken');
  const conflicting = createRegexLanguage({id:'new', aliases:['free', 'taken'], tokens:[
    {kind:'intruder',pattern:/ok/},
  ]});
  assert.throws(()=>h.use(conflicting),/registration conflict: taken/);
  assert.equal(h.language('new'),undefined);
  assert.equal(h.language('free'),undefined);
  assert.equal(h.language('taken'),existing);
  assert.equal(h.highlight('ok&🌐','taken'),output);

  const fresh = createRegexLanguage({id:'fresh', aliases:['free'],tokens:[
    {kind:'accepted',pattern:/🌐/u},
  ]});
  assert.equal(h.use(fresh),h);
  assert.equal(h.language('free'),fresh);
  assert.equal(h.highlight('ok&🌐','free'),'ok&amp;<span class="tok-accepted">🌐</span>');

  const forgedRenderer = {kind:'renderer',id:'html',render:()=>'<script>evil</script>'};
  assert.throws(()=>h.use(forgedRenderer),/renderer registration conflict: html/);
  assert.equal(h.highlight('ok&🌐','taken'),output);
  assert.equal(h.highlight('ok&🌐','free'),'ok&amp;<span class="tok-accepted">🌐</span>');
});

test('failed invalid registration does not poison later valid independent lookups', () => {
  const h = new SyntaxHighlighter();
  assert.throws(()=>h.use({kind:'language',id:'broken',aliases:'not-an-array',tokenize:()=>[]}),/aliases must be an array/);
  assert.equal(h.language('broken'),undefined);
  assert.equal(h.language('n'),undefined);
  const valid = createRegexLanguage({id:'legal',aliases:['n'],tokens:[{kind:'digit',pattern:/[0-9]+/}]});
  h.use(valid);
  assert.equal(h.highlight('3<&','n'),'<span class="tok-digit">3</span>&lt;&amp;');
});
