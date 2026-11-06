import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter} from '../src/core.js';

// Host-side namespace/recovery test; does not prove compiled guest parity.
test('failed alias reservation never poisons a trusted Map key or later registration', () => {
  const trusted=createRegexLanguage({
    id:'wave3306-trusted',aliases:['constructor','__proto__'],
    tokens:[{kind:'trusted',pattern:/safe/}],
  });
  const editor=new SyntaxHighlighter({languages:[trusted]});
  const malicious=createRegexLanguage({
    id:'wave3306-hostile',aliases:['__proto__','wave3306-unclaimed'],
    tokens:[{kind:'forged',pattern:/unsafe/}],
  });
  assert.throws(()=>editor.use(malicious),/language registration conflict/);
  assert.equal(editor.language('wave3306-hostile'),undefined);
  assert.equal(editor.language('wave3306-unclaimed'),undefined);
  assert.equal(editor.highlight('<safe>', 'constructor'),
    '&lt;<span class="tok-trusted">safe</span>&gt;');
  const separate=new SyntaxHighlighter({languages:[malicious]});
  assert.equal(separate.highlight('unsafe','__proto__'),
    '<span class="tok-forged">unsafe</span>');
  const repaired=createRegexLanguage({
    id:'wave3306-unclaimed',tokens:[{kind:'recovered',pattern:/ok/}],
  });
  editor.use(repaired);
  assert.equal(editor.highlight('ok','wave3306-unclaimed'),
    '<span class="tok-recovered">ok</span>');
  assert.equal(editor.highlight('safe','__proto__'),
    '<span class="tok-trusted">safe</span>');
});

test('unknown renderer rejects before any caller plugin receives input', () => {
  let calls=0;
  const spy={kind:'language',id:'wave3306-spy',aliases:[],
    tokenize(source){calls++;return [{kind:'plain',value:source}];}};
  const highlighter=new SyntaxHighlighter({languages:[spy]});
  assert.throws(()=>highlighter.highlight('<bad>','wave3306-spy',
    {renderer:'absent-renderer'}),/unknown renderer/);
  assert.equal(calls,0);
  assert.equal(highlighter.highlight('<ok>','wave3306-spy'),'&lt;ok&gt;');
  assert.equal(calls,1);
});
