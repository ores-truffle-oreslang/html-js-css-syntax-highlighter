import test from 'node:test';
import assert from 'node:assert/strict';
import { astro } from '../src/plugins/astro.js';

// First-party Astro host syntax highlighting, not an Astro compiler parse.
test('frontmatter, directive attributes and comments preserve exact source bytes', () => {
  const source = [
    '---',
    'const title = "safe";',
    '---',
    '<!-- <script>literal comment</script> -->',
    '<Widget client:load set:text="safe">{title}</Widget>',
  ].join('\n');
  const first = astro.tokenize(source);
  assert.equal(first.map(token => token.value).join(''), source);
  assert.deepEqual(astro.tokenize(source), first);
  assert.ok(first.some(token => token.kind === 'comment' &&
    token.value === '<!-- <script>literal comment</script> -->'));
  for (const directive of ['client:load', 'set:text']) {
    assert.ok(first.some(token => token.kind === 'directive' && token.value === directive), directive);
  }
  assert.ok(first.some(token => token.kind === 'frontmatter' && token.value.includes('---')));
});

test('Astro alias retains one language identity and a distinct source token stream', () => {
  assert.equal(astro.id, 'astro');
  assert.ok(astro.aliases.includes('astro-template'));
  const code = '<Box client:visible={true} />';
  const tokens = astro.tokenize(code);
  assert.equal(tokens.map(token => token.value).join(''), code);
  assert.ok(tokens.some(token => token.kind === 'directive' && token.value === 'client:visible'));
});
