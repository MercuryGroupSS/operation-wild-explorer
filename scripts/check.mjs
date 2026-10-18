/** Dependency-free release checks. Run: node scripts/check.mjs
 * Checks syntax, required assets, release versions and manifest references.
 * Does not replace testing gameplay in Safari or on a physical iPhone.
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, sep } from 'node:path';
import { Script } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = resolve(root, 'public');
const text = name => readFileSync(resolve(pub, name), 'utf8');
function asset(reference) {
  if (/^(?:https?:|data:|mailto:|tel:|#)/i.test(reference)) return;
  const rel = reference.split(/[?#]/)[0].replace(/^\/+/, '');
  if (!rel || rel === './') return;
  const full = resolve(pub, rel);
  assert(full.startsWith(pub + sep), `Asset escapes publish folder: ${reference}`);
  assert(existsSync(full), `Missing asset: ${reference}`);
}
try {
  for (const name of ['index.html','styles.css','app.js','sw.js','manifest.webmanifest','_headers']) asset(name);
  const app = text('app.js');
  const sw = text('sw.js');
  const html = text('index.html');
  new Script(app, { filename: 'app.js' });
  new Script(sw, { filename: 'sw.js' });
  new Script(text('engine.js'), { filename: 'engine.js' });
  new Script(text('postcards.js'), { filename: 'postcards.js' });
  const version = app.match(/const VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1];
  assert(version && /^\d+\.\d+\.\d+$/.test(version), 'Expected semantic release version in app.js');
  assert.equal(sw.match(/const VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1], version, 'Service worker and app versions differ');
  for (const file of ['app.js', 'styles.css', 'engine.js', 'postcards.js']) {
    assert(html.includes(`${file}?v=${version}`), `${file}: update index.html query version`);
    assert(sw.includes(`${file}?v=${version}`), `${file}: update service-worker cached URL`);
  }
  for (const m of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) asset(m[1]);
  for (const m of text('styles.css').matchAll(/url\(\s*["']?([^\)"']+)["']?\s*\)/g)) asset(m[1].trim());
  const core = sw.match(/const CORE\s*=\s*(\[[\s\S]*?\]);/)?.[1];
  assert(core, 'Expected service worker CORE asset list');
  for (const m of core.matchAll(/["']([^"']+)["']/g)) asset(m[1]);
  const manifest = JSON.parse(text('manifest.webmanifest'));
  assert(['standalone','fullscreen'].includes(manifest.display), 'Expected app-like display mode');
  assert(Array.isArray(manifest.icons) && manifest.icons.length, 'Missing app icons');
  manifest.icons.forEach(icon => asset(icon.src));
  assert(app.includes("const SAVE_KEY = 'wildExplorerSaveV2'"), 'Save key changed: provide and test an explicit migration');
  assert(app.includes("const OLD_KEY = 'wildExplorerSave'"), 'Legacy save migration key is missing');
  console.log(`PASS: Wild Explorer ${version} syntax, assets, manifest, cache versions and save-key checks.`);
  console.log('Phone gameplay, geolocation permissions and update behavior still require browser testing.');
} catch (error) {
  console.error('RELEASE CHECK FAILED:', error.message);
  process.exitCode = 1;
}
