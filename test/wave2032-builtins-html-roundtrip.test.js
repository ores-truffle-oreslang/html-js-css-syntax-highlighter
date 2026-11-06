import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultHighlighter,escapeHtml} from '../src/index.js';

test('all built-in frontend grammars preserve hostile Unicode source through HTML escaping', () => {
  const samples = [
    ['html', '<section data-x="&<>"><svg onload="bad()">🙂</svg></section>'],
    ['css', '/* <unsafe>&"🙂 */\nsection::before { content: "<svg>&"; }'],
    ['javascript', 'const payload = "<svg onload=\\"bad()\\">&🙂"; // <tag>'],
    ['astro', '---\nconst raw = "<svg>&🙂";\n---\n<div title="&<>">{raw}</div>']
  ];
  for (const [name,source] of samples) {
    const tokens = defaultHighlighter.tokenize(source,name);
    assert.equal(tokens.map(t=>t.value).join(''),source,name);
    const first = defaultHighlighter.highlight(source,name);
    const second = defaultHighlighter.highlight(source,name);
    assert.equal(second,first,name);
    const recovered = first.replace(/<span class="[^"]*">|<\/span>/g,'');
    assert.equal(recovered,escapeHtml(source),name);
    assert.ok(!first.includes('<svg'),name);
    assert.ok(!first.includes('onload="bad()"'),name);
    assert.ok(first.includes('&lt;'),name);
    assert.ok(first.includes('&amp;'),name);
  }
});
