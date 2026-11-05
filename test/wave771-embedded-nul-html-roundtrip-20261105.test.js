// Host source conservation and HTML escaping of mixed-width source text.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRegexLanguage, SyntaxHighlighter, escapeHtml} from '../src/core.js';

const language=createRegexLanguage({
  id:'wave771-source-ownership',
  tokens:[{kind:'word',pattern:/[A-Z]+/u}]
});
const highlighter=new SyntaxHighlighter({languages:[language]});

test('astral characters and embedded NUL survive tokenization as source data', () => {
  const source='😀\r\n<ABC>&"\'🙂\u0000é';
  for(let i=0;i<3;i++){
    const tokens=highlighter.tokenize(source,language.id);
    assert.equal(tokens.map(token=>token.value).join(''),source);
    assert.deepEqual(tokens.filter(token=>token.kind==='word'),
      [{kind:'word',value:'ABC'}]);
    assert.ok(tokens.every(token=>token.value.length>0));
  }
});

test('HTML renderer escapes source and class-prefix authority independently', () => {
  const source='😀\r\n<ABC>&"\'🙂é';
  const rendered=highlighter.highlight(source,language.id,{
    classPrefix:'class" onfocus="evil-'
  });
  assert.equal(rendered,
    '😀\r\n&lt;<span class="class&quot; onfocus=&quot;evil-word">ABC</span>&gt;&amp;&quot;&#039;🙂é');
  assert.equal(rendered.includes(' onfocus="'),false);
  assert.equal(escapeHtml(source),'😀\r\n&lt;ABC&gt;&amp;&quot;&#039;🙂é');
  assert.deepEqual(highlighter.tokenize(source,language.id).map(t=>t.value).join(''),source);
});
