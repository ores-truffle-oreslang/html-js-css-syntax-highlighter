import test from 'node:test';
import assert from 'node:assert/strict';
import {css} from '../src/plugins/css.js';
import {SyntaxHighlighter} from '../src/core.js';

test('CSS hex and dimension boundaries preserve comments, quoted values and original UTF-8', () => {
  const input = '/* #abc 3px */\r\n.card:hover { background-color: #AbC; ' +
    'border-color: #12345678; transition-duration: 125ms; content: "#fed"; }';
  const bytes = new TextEncoder().encode(input);
  const expected = [
    ['comment','/* #abc 3px */'],
    ['selector','.card'],
    ['property','background-color'],
    ['hex','#AbC'],
    ['property','border-color'],
    ['hex','#12345678'],
    ['property','transition-duration'],
    ['number','125ms'],
    ['property','content'],
    ['string','"#fed"'],
  ];
  const renderer = new SyntaxHighlighter({languages:[css]});
  for (let i=0;i<8;i++) {
    const tokens = css.tokenize(input);
    assert.deepEqual(new TextEncoder().encode(tokens.map(x=>x.value).join('')),bytes);
    const reduced = tokens.filter(x=>expected.some(([kind,value])=>kind===x.kind&&value===x.value));
    assert.deepEqual(reduced.map(x=>[x.kind,x.value]), expected);
    assert.equal(tokens.some(x=>x.kind==='hex' && x.value==='#abc'),false);
    assert.equal(tokens.some(x=>x.kind==='hex' && x.value==='#fed'),false);
    const rendered = renderer.highlight(input,'css');
    assert.ok(rendered.includes('class="tok-hex">#AbC</span>'));
    assert.ok(rendered.includes('&quot;#fed&quot;'));
  }
});

test('invalid overlong hex-like CSS selectors are not truncated into valid colors',()=>{
  const source='#123456789 { color: "#aaa"; }';
  const tokens=css.tokenize(source);
  assert.equal(tokens.map(x=>x.value).join(''),source);
  assert.equal(tokens.some(x=>x.kind==='hex' && x.value==='#12345678'),false);
  assert.equal(tokens.some(x=>x.kind==='hex' && x.value==='#aaa'),false);
});
