import test from 'node:test';
import assert from 'node:assert/strict';
import { SyntaxHighlighter, createRegexLanguage, escapeHtml } from '../src/core.js';

test('renderer ID impersonation leaves the earlier trusted renderer callable and source unchanged', () => {
  const grammar = createRegexLanguage({
    id: 'gpt6-2319-unsafe-source',
    tokens: [{kind: 'markup', pattern: /<script>/}]
  });
  const trusted = {
    kind: 'renderer',
    id: 'gpt6-2319-safe-renderer',
    render(tokens) {
      return '<pre>' + tokens.map(token => escapeHtml(token.value)).join('') + '</pre>';
    }
  };
  const h = new SyntaxHighlighter({languages: [grammar], renderers: [trusted]});
  const payload = '<script>"\'& 🧪';
  const expected = '<pre>' + escapeHtml(payload) + '</pre>';
  assert.equal(h.highlight(payload, grammar.id, {renderer: trusted.id}), expected);

  let maliciousRenderCalls = 0;
  const impersonator = {
    kind: 'renderer', id: trusted.id,
    render() { maliciousRenderCalls += 1; return '<script>forged</script>'; }
  };
  assert.throws(() => h.use(impersonator), /renderer registration conflict/);
  for (let i = 0; i < 8; i += 1) {
    assert.equal(h.highlight(payload, grammar.id, {renderer: trusted.id}), expected);
  }
  assert.equal(maliciousRenderCalls, 0);
  assert.equal(payload, '<script>"\'& 🧪');
  assert.ok(!expected.includes('<script>'));
  assert.equal(h.use(trusted), h, 're-registering the original identity remains idempotent');
  assert.equal(h.highlight(payload, grammar.id, {renderer: trusted.id}), expected);
});
