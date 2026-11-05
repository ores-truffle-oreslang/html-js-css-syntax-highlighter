// Host-only renderer input ownership regression; no compiler guest claim.
import test from 'node:test';
import assert from 'node:assert/strict';
import {htmlRenderer} from '../src/core.js';

test('frozen caller token records remain unchanged across HTML renders', () => {
  const tokens = Object.freeze([
    Object.freeze({kind: 'plain', value: '<raw&>'}),
    Object.freeze({kind: 'keyword', value: '"quoted" & <angle>'}),
    Object.freeze({kind: 'operator', value: "'value'"}),
  ]);
  const options = Object.freeze({classPrefix: 'x" onfocus="evil-'});
  const output = htmlRenderer.render(tokens, options);
  assert.equal(output, '&lt;raw&amp;&gt;'
    + '<span class="x&quot; onfocus=&quot;evil-keyword">&quot;quoted&quot; &amp; &lt;angle&gt;</span>'
    + '<span class="x&quot; onfocus=&quot;evil-operator">&#039;value&#039;</span>');
  assert.equal(htmlRenderer.render(tokens, options), output);
  assert.deepEqual(tokens.map(x => [x.kind, x.value]), [
    ['plain', '<raw&>'],
    ['keyword', '"quoted" & <angle>'],
    ['operator', "'value'"],
  ]);
});

test('empty and plain-only rendering does not invent wrapper markup', () => {
  assert.equal(htmlRenderer.render([]), '');
  assert.equal(htmlRenderer.render([{kind:'plain',value:'a\n<b>&c'}]), 'a\n&lt;b&gt;&amp;c');
});
