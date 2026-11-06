// Independent literal HTML escape oracle, including an untrusted CSS class prefix.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter } from '../src/core.js';

test('frozen hostile tokens and class prefixes remain escaped without mutation', () => {
  const tokens = Object.freeze([
    Object.freeze({kind: 'name', value: '<&>\\"\x27'}),
    Object.freeze({kind: 'plain', value: '\n🙂'}),
  ]);
  const highlighter = new SyntaxHighlighter({
    languages: [{kind: 'language', id: 'wave2030-escape', aliases: [], tokenize: () => tokens}],
  });
  const options = Object.freeze({classPrefix: 'x"\x27<>'});
  const expected = '<span class="x&quot;&#039;&lt;&gt;name">&lt;&amp;&gt;\\&quot;&#039;</span>\n🙂';
  for (let attempt = 0; attempt < 12; attempt++) {
    assert.equal(highlighter.highlight('ignored', 'wave2030-escape', options), expected);
    assert.equal(highlighter.highlight('ignored', 'wave2030-escape'), '<span class="tok-name">&lt;&amp;&gt;\\&quot;&#039;</span>\n🙂');
  }
  assert.equal(tokens[0].kind, 'name');
  assert.equal(options.classPrefix, 'x"\x27<>');
});
