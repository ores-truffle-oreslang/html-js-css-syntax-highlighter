import test from 'node:test';
import assert from 'node:assert/strict';
import {htmlRenderer} from '../src/core.js';

// Source-owned HTML admission; these tests do not execute an AttoLang guest.
test('frozen Unicode/plain tokens and attacker-controlled class fields remain inert', () => {
  const source = '💠\0<&>"\'\r\n<script>';
  const tokens = Object.freeze([
    Object.freeze({kind: 'plain', value: source}),
    Object.freeze({kind: 'warning" onmouseover="bad', value: '<&"\'💠'}),
  ]);
  const classPrefix = 'prefix" onclick="surprise-';
  const expected =
    '💠\0&lt;&amp;&gt;&quot;&#039;\r\n&lt;script&gt;' +
    '<span class="prefix&quot; onclick=&quot;surprise-warning&quot; onmouseover=&quot;bad">' +
    '&lt;&amp;&quot;&#039;💠</span>';
  for (let i = 0; i < 5; i++) {
    const output = htmlRenderer.render(tokens, {classPrefix});
    assert.equal(output, expected);
    assert.ok(!output.includes('<script>'));
    assert.ok(!output.includes('onclick="surprise'));
    assert.ok(!output.includes('onmouseover="bad'));
    assert.equal(tokens[0].value, source);
    assert.equal(tokens[1].kind, 'warning" onmouseover="bad');
  }
});

test('plain-only HTML output escapes every metacharacter without synthetic tags', () => {
  const tokens = Object.freeze([Object.freeze({kind: 'plain', value: '&<>"\'\0💠'})]);
  assert.equal(htmlRenderer.render(tokens), '&amp;&lt;&gt;&quot;&#039;\0💠');
});
