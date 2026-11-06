import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter, htmlRenderer} from '../src/core.js';

// Source-owned host plugin registry test; not compiler guest execution.
test('per-instance renderer ownership accepts same object but rejects conflicting replacement', () => {
  const language = {
    kind: 'language',
    id: 'gpt6-wave8334-words',
    aliases: ['gpt6-wave8334-short'],
    tokenize: text => [{kind: 'plain', value: text}],
  };
  const rendererA = {
    kind: 'renderer', id: 'gpt6-wave8334-custom',
    render: tokens => 'A|' + tokens.map(t => t.value).join(''),
  };
  const rendererB = {
    kind: 'renderer', id: 'gpt6-wave8334-custom',
    render: tokens => 'B|' + tokens.map(t => t.value).join(''),
  };
  const one = new SyntaxHighlighter({languages: [language], renderers: [htmlRenderer, rendererA]});
  const two = new SyntaxHighlighter({languages: [language], renderers: [htmlRenderer, rendererB]});
  const text = '<script>🍎&"\'';
  const options = Object.freeze({renderer: 'gpt6-wave8334-custom'});
  for (let i = 0; i < 4; i++) {
    assert.equal(one.highlight(text, 'gpt6-wave8334-short', options), 'A|' + text);
    assert.equal(two.highlight(text, 'gpt6-wave8334-words', options), 'B|' + text);
    // Registration of the same renderer identity is idempotent.
    assert.equal(one.use(rendererA), one);
    assert.equal(two.use(rendererB), two);
  }
  assert.throws(() => one.use(rendererB), /renderer registration conflict/);
  assert.throws(() => two.use(rendererA), /renderer registration conflict/);
  assert.equal(one.highlight(text, 'gpt6-wave8334-words', options), 'A|' + text);
  assert.equal(two.highlight(text, 'gpt6-wave8334-short', options), 'B|' + text);
  const escaped = '&lt;script&gt;🍎&amp;&quot;&#039;';
  assert.equal(one.highlight(text, 'gpt6-wave8334-words'), escaped);
  assert.equal(two.highlight(text, 'gpt6-wave8334-short'), escaped);
});
