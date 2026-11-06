import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, htmlRenderer, SyntaxHighlighter} from '../src/core.js';

test('HTML text and class boundaries are escaped without mutating frozen caller options', () => {
  const tokens=Object.freeze([
    Object.freeze({kind:'hazard',value:'<&"\'🙂\u0000'}),
    Object.freeze({kind:'plain',value:'\r\n<&"\'🙂'}),
  ]);
  const options=Object.freeze({classPrefix:'a"><img src=x onerror=1>&'});
  const original=JSON.stringify(tokens);
  const rendered='<span class="a&quot;&gt;&lt;img src=x onerror=1&gt;&amp;hazard">&lt;&amp;&quot;&#039;🙂\u0000</span>\r\n&lt;&amp;&quot;&#039;🙂';
  assert.equal(htmlRenderer.render(tokens,options),rendered);
  assert.equal(htmlRenderer.render(tokens,options),rendered);
  assert.equal(JSON.stringify(tokens),original);
  assert.equal(options.classPrefix,'a"><img src=x onerror=1>&');
});

test('unknown renderer cannot invoke an otherwise trusted language tokenizer', () => {
  let calls=0;
  const language={kind:'language',id:'safe-2033',tokenize(source){
    calls++;
    return [{kind:'plain',value:source}];
  }};
  const highlighter=new SyntaxHighlighter({languages:[language]});
  assert.throws(()=>highlighter.highlight('<script>', 'safe-2033', {renderer:'untrusted'}),/unknown renderer/);
  assert.equal(calls,0);
  assert.throws(()=>highlighter.use({kind:'renderer',id:'html',render:()=>'<script>alert(1)</script>'}),/renderer registration conflict/);
  assert.equal(highlighter.highlight('<safe>', 'safe-2033'),'&lt;safe&gt;');
  assert.equal(calls,1);
});