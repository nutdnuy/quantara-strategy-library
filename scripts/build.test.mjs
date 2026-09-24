import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { buildSite, parseStrategy, readStrategies } from './build.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6SAAAAAASUVORK5CYII=', 'base64');

function strategy(slug, overrides = {}) {
  return {
    slug, title: `Strategy ${slug}`, category: 'Research', summary: 'A research idea.',
    itemName: 'Explorer Relic', itemOrigin: 'Quantara', itemLore: 'A tool for discovery.',
    image: `assets/items/${slug}.png`, order: 10, published: true,
    sources: [{ title: 'Reference', url: 'https://www.quantconnect.com/docs/v2/writing-algorithms/strategy-library' }],
    ...overrides,
  };
}

const markdown = (record, body = '## Concept\n\nAn educational concept.\n\n- First step') => `---\n${JSON.stringify(record, null, 2)}\n---\n\n${body}\n`;

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'quantara-build-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'content', 'strategies'), { recursive: true });
  await mkdir(path.join(root, 'assets', 'items'), { recursive: true });
  for (const filename of ['index.html', 'styles.css', 'app.js']) await writeFile(path.join(root, filename), filename);
  return root;
}

async function add(root, record, filename = `${record.slug}.md`, withImage = true) {
  await writeFile(path.join(root, 'content', 'strategies', filename), markdown(record));
  if (withImage) await writeFile(path.join(root, 'assets', 'items', `${record.slug}.png`), png);
}

test('adding a sixth Markdown file automatically adds a sixth published card', async (t) => {
  const root = await fixture(t);
  for (let i = 1; i <= 5; i++) await add(root, strategy(`idea-${i}`, { order: i }));
  assert.equal((await buildSite(root)).strategies.length, 5);
  await add(root, strategy('idea-6', { order: 6 }));
  await buildSite(root);
  const output = JSON.parse(await readFile(path.join(root, 'dist', 'data', 'strategies.json'), 'utf8'));
  assert.equal(output.length, 6);
  assert.equal(output[5].slug, 'idea-6');
  assert.match(output[5].body, /## Concept/);
  assert.deepEqual(await readdir(path.join(root, 'dist')), ['.nojekyll', 'app.js', 'assets', 'data', 'index.html', 'styles.css']);
});

test('draft content is omitted and cards sort by order then title', async (t) => {
  const root = await fixture(t);
  await add(root, strategy('early', { order: 1, title: 'Zebra' }));
  await add(root, strategy('later-z', { order: 20, title: 'Zebra' }));
  await add(root, strategy('later-a', { order: 20, title: 'Alpha' }));
  await add(root, strategy('draft', { published: false }));
  const { strategies } = await buildSite(root);
  assert.deepEqual(strategies.map(({ slug }) => slug), ['early', 'later-a', 'later-z']);
  assert.doesNotMatch(await readFile(path.join(root, 'dist', 'data', 'strategies.json'), 'utf8'), /"slug": "draft"/);
});

test('deployment excludes authoring metadata and retains asset and font licenses', async (t) => {
  const root = await fixture(t);
  await add(root, strategy('first'));
  await writeFile(path.join(root, 'assets', 'items', 'provenance.json'), '{"authoring":"private working record"}');
  await writeFile(path.join(root, 'assets', 'items', 'README.md'), '# Internal asset notes');
  await mkdir(path.join(root, 'assets', 'fonts'));
  await writeFile(path.join(root, 'assets', 'fonts', 'Roboto-LICENSE'), 'Roboto license text');
  await writeFile(path.join(root, 'assets', 'fonts', 'Noto-Sans-Thai-LICENSE'), 'Noto license text');
  await writeFile(path.join(root, 'assets', 'LICENSE.md'), 'Public asset attribution');
  await buildSite(root);
  const outputAssets = path.join(root, 'dist', 'assets');
  assert.deepEqual(await readdir(path.join(outputAssets, 'items')), ['first.png']);
  assert.equal(await readFile(path.join(outputAssets, 'fonts', 'Roboto-LICENSE'), 'utf8'), 'Roboto license text');
  assert.equal(await readFile(path.join(outputAssets, 'fonts', 'Noto-Sans-Thai-LICENSE'), 'utf8'), 'Noto license text');
  assert.equal(await readFile(path.join(outputAssets, 'LICENSE.md'), 'utf8'), 'Public asset attribution');
  assert.match(await readFile(path.join(root, 'assets', 'items', 'provenance.json'), 'utf8'), /private working record/);
});

test('an incomplete draft fails with the filename and missing field', async (t) => {
  const root = await fixture(t);
  await add(root, strategy('draft', { published: false, itemName: '' }));
  await assert.rejects(readStrategies(root), /content\/strategies\/draft.md: "itemName" must be a non-empty string/);
});

test('missing images fail before overwriting a previous build', async (t) => {
  const root = await fixture(t);
  await add(root, strategy('first'));
  await buildSite(root);
  const before = await readFile(path.join(root, 'dist', 'data', 'strategies.json'), 'utf8');
  await add(root, strategy('missing'), 'missing.md', false);
  await assert.rejects(buildSite(root), /missing.md: Image not found: assets\/items\/missing.png/);
  assert.equal(await readFile(path.join(root, 'dist', 'data', 'strategies.json'), 'utf8'), before);
});

test('unsafe image paths are rejected', () => {
  for (const image of ['../private.png', '/assets/items/card.png', 'assets/items/../../secret.png', 'assets/items/card.svg', 'https://example.com/card.png']) {
    assert.throws(() => parseStrategy(markdown(strategy('safe', { image }))), /safe relative PNG path/);
  }
});

test('image symlinks cannot escape the items directory', async (t) => {
  const root = await fixture(t);
  await add(root, strategy('escaped'), 'escaped.md', false);
  await writeFile(path.join(root, 'private.png'), png);
  await symlink(path.join(root, 'private.png'), path.join(root, 'assets', 'items', 'escaped.png'));
  await assert.rejects(readStrategies(root), /Image must resolve to a file inside assets\/items/);
});

test('source links require absolute HTTPS without credentials', () => {
  for (const url of ['javascript:alert(1)', 'http://example.com', '/local/path', 'https://user:pass@example.com']) {
    assert.throws(() => parseStrategy(markdown(strategy('safe', { sources: [{ title: 'Reference', url }] }))), /absolute HTTPS URL/);
  }
});

test('duplicate slugs identify both conflicting files', async (t) => {
  const root = await fixture(t);
  await add(root, strategy('same'));
  await add(root, strategy('same'), 'duplicate.md');
  await assert.rejects(readStrategies(root), /Duplicate slug "same" also used by duplicate.md/);
});

test('filenames must match their slugs', async (t) => {
  const root = await fixture(t);
  await add(root, strategy('correct'), 'wrong.md');
  await assert.rejects(readStrategies(root), /rename it to correct.md/);
});

test('schema errors and JSON formatting errors are actionable', () => {
  assert.throws(() => parseStrategy('---\n{"slug": "example",}\n---\nBody', 'bad.md'), /bad.md: Frontmatter must be valid JSON/);
  assert.throws(() => parseStrategy(markdown(strategy('example', { publish: true }))), /Unknown field "publish"/);
  assert.throws(() => parseStrategy(markdown(strategy('example', { published: 'true' }))), /"published" must be true or false/);
  assert.throws(() => parseStrategy(markdown(strategy('example', { order: -1 }))), /"order" must be a non-negative integer/);
  assert.throws(() => parseStrategy(markdown(strategy('example'), '')), /Markdown body/);
});

test('Markdown and HTML-like input stays text in the generated data', () => {
  const body = '## Notes\n\n<script>alert(1)</script>\n\n- Read the source';
  assert.equal(parseStrategy(markdown(strategy('plain'), body)).body, body);
});

test('optional game art is validated and exported without replacing classic art', async (t) => {
  const root = await fixture(t);
  const record = strategy('first', { gameImage: 'assets/items/first-game.png' });
  await add(root, record);
  await assert.rejects(buildSite(root), /Image not found: assets\/items\/first-game.png/);
  await writeFile(path.join(root, 'assets', 'items', 'first-game.png'), png);
  await buildSite(root);
  const [output] = JSON.parse(await readFile(path.join(root, 'dist', 'data', 'strategies.json'), 'utf8'));
  assert.equal(output.image, 'assets/items/first.png');
  assert.equal(output.gameImage, 'assets/items/first-game.png');
  assert.throws(() => parseStrategy(markdown({ ...record, gameImage: '../private.png' })), /safe relative PNG path/);
});
