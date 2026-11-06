import test from 'node:test';
import assert from 'node:assert/strict';
import {htmlRenderer, SyntaxHighlighter} from '../src/core.js';

const charEscape = raw => [...String(raw)].map(char=>({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;',
})[char] ?? char).join('');

test('frozen caller-controlled token metadata remains HTML attribute data not markup', () => {
  const categories = ['kw" onfocus="alert(1)', '<svg/onload=bad>', "'>&"];
  const values = ['</span><script>boom</script>', '💠 & " \u0000', "a'b<c>d"];
  const prefixes = ['p"', 'tok-<', "prefix-'&"];
  for(let i=0;i<categories.length;i++) {
    const kind=categories[i], value=values[i], classPrefix=prefixes[i];
    const tokens=Object.freeze([
      Object.freeze({kind:'plain',value:'<raw>&'}),
      Object.freeze({kind,value}),
    ]);
    const options=Object.freeze({classPrefix});
    const expected=charEscape('<raw>&') +
      '<span class="' + charEscape(classPrefix+kind) + '">' + charEscape(value) + '</span>';
    for(let retry=0;retry<6;retry++) {
      const output=htmlRenderer.render(tokens,options);
      assert.equal(output,expected);
      assert.ok(output.startsWith('&lt;raw&gt;&amp;<span class="'));
      assert.equal(output.includes('<script>'),false);
      assert.deepEqual(tokens[1],{kind,value});
      assert.deepEqual(options,{classPrefix});
    }
  }
});

test('unknown renderer fails before a registered grammar can tokenize', () => {
  let visits=0;
  const grammar={kind:'language',id:'wave2141-failclosed',tokenize(){visits++;return [{kind:'plain',value:'bad'}]}};
  const host=new SyntaxHighlighter({languages:[grammar]});
  assert.throws(()=>host.highlight('source','wave2141-failclosed',
    Object.freeze({renderer:'unregistered'})),/unknown renderer/);
  assert.equal(visits,0);
  assert.equal(host.highlight('<x>&','wave2141-failclosed'), 'bad');
  assert.equal(visits,1);
});
