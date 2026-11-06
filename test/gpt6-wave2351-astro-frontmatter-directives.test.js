import test from 'node:test';
import assert from 'node:assert/strict';
import {astro, defaultHighlighter, escapeHtml} from '../src/index.js';

test('actual Astro grammar isolates frontmatter, directives, HTML and comments across aliases',()=>{
  const source = [
    '---',
    'const title = "<script>"; // client:only',
    '---',
    '<section client:load class:list={items} set:html={unsafe}>',
    '  <!-- return const <img> -->',
    '  <div title="&amp;">🚀 &lt;</div>',
    '</section>'
  ].join('\n');
  const tokens=astro.tokenize(source);
  const values=kind=>tokens.filter(t=>t.kind===kind).map(t=>t.value);
  assert.equal(values('frontmatter').length,2);
  assert.ok(values('frontmatter').every(v=>v.trim()==='---'));
  assert.deepEqual(values('directive'),['client:load','class:list','set:html']);
  assert.deepEqual(values('tag'),['<section','<div','</div','</section']);
  assert.ok(values('comment').some(v=>v.includes('client:only')));
  assert.ok(values('comment').some(v=>v.includes('<img>')));
  assert.equal(values('string').includes('"<script>"'),true);
  assert.equal(tokens.map(t=>t.value).join(''),source);
  for(const alias of ['astro','astro-template']){
    assert.equal(defaultHighlighter.language(alias),astro);
    for(let i=0;i<3;i++){
      assert.deepEqual(defaultHighlighter.tokenize(source,alias),tokens);
      const rendered=defaultHighlighter.highlight(source,alias);
      assert.equal(rendered.replace(/<\/?span(?:\s+[^>]*)?>/g,''),escapeHtml(source));
      assert.equal(rendered.includes('<script>'),false);
    }
  }
});
