import test from 'node:test';
import assert from 'node:assert/strict';
import {SyntaxHighlighter, createRegexLanguage, htmlRenderer} from '../src/core.js';
import {highlightForAstro, astroCodeProps} from '../src/adapters/astro.js';

// Host Astro integration: render as escaped HTML irrespective of a caller's
// untrusted renderer selection. Never claim this proves AttoLang guest output.
test('Astro forces trusted HTML and routes registered alias without changing frozen options', () => {
  const grammar = createRegexLanguage({
    id:'wave2031-astro-language',
    aliases:['wave2031-astro-alias'],
    tokens:[{kind:'keyword',pattern:/HELLO/g}],
  });
  let hostileRenderCalls = 0;
  const hostileRenderer = {
    kind:'renderer',id:'untrusted',
    render() { hostileRenderCalls++; throw new Error('untrusted renderer invoked'); }
  };
  const host = new SyntaxHighlighter({languages:[grammar],renderers:[htmlRenderer,hostileRenderer]});
  const options = Object.freeze({renderer:'untrusted',classPrefix:'p" data-attack="'});
  const code = '<x>HELLO&\u0000💠';
  const expected = '&lt;x&gt;<span class="p&quot; data-attack=&quot;keyword">HELLO</span>&amp;\u0000💠';

  for (let repetition=0; repetition<5; repetition++) {
    assert.deepEqual(highlightForAstro(host,code,'wave2031-astro-alias',options),{html:expected});
    assert.deepEqual(astroCodeProps(host,code,'wave2031-astro-language',options),{html:expected});
    assert.equal(hostileRenderCalls,0);
    assert.deepEqual(options,{renderer:'untrusted',classPrefix:'p" data-attack="'});
    assert.equal(host.tokenize(code,'wave2031-astro-alias').map(token=>token.value).join(''),code);
  }
});

test('Astro does not make unknown languages implicitly trusted', () => {
  const language = createRegexLanguage({id:'known',tokens:[{kind:'word',pattern:/safe/}]});
  const host = new SyntaxHighlighter({languages:[language]});
  assert.throws(()=>highlightForAstro(host,'untrusted','missing',{}),/unknown language/);
  const before = astroCodeProps(host,'<script>safe</script>','known').html;
  assert.equal(before,
    '&lt;script&gt;<span class="tok-word">safe</span>&lt;/script&gt;');
});
