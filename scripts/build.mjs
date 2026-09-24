import { cp, mkdir, readFile, readdir, realpath, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = fileURLToPath(new URL('../', import.meta.url));
const fields = new Set([
  'slug', 'title', 'category', 'summary', 'itemName', 'itemOrigin', 'itemLore',
  'image', 'gameImage', 'order', 'published', 'sources', 'sourceNote',
]);
const textFields = ['slug', 'title', 'category', 'summary', 'itemName', 'itemOrigin', 'itemLore', 'image'];

function invalid(filename, message) {
  throw new Error(`${filename}: ${message}`);
}

function requireText(value, field, filename) {
  if (typeof value !== 'string' || !value.trim()) invalid(filename, `"${field}" must be a non-empty string.`);
  return value.trim();
}

/** Parse JSON frontmatter; Markdown stays plain text until safe client rendering. */
export function parseStrategy(source, filename = 'strategy.md') {
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
  if (!match) invalid(filename, 'Add a JSON object between opening and closing --- lines at the start of the file.');
  let data;
  try {
    data = JSON.parse(match[1]);
  } catch (error) {
    invalid(filename, `Frontmatter must be valid JSON (double quotes, no trailing commas). ${error.message}`);
  }
  if (!data || Array.isArray(data) || typeof data !== 'object') invalid(filename, 'Frontmatter must be a JSON object.');
  for (const field of Object.keys(data)) {
    if (!fields.has(field)) invalid(filename, `Unknown field "${field}". Check the template for supported fields.`);
  }
  const record = {};
  for (const field of textFields) record[field] = requireText(data[field], field, filename);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) {
    invalid(filename, '"slug" must use lowercase English letters, numbers and single hyphens, e.g. index-arbitrage.');
  }
  if (data.gameImage !== undefined) record.gameImage = requireText(data.gameImage, 'gameImage', filename);
  for (const field of ['image', 'gameImage']) {
    if (record[field] === undefined) continue;
    if (!/^assets\/items\/[a-zA-Z0-9][a-zA-Z0-9/_-]*\.png$/.test(record[field]) || record[field].includes('//')) {
      invalid(filename, `"${field}" must be a safe relative PNG path under assets/items/, e.g. assets/items/index-arbitrage.png.`);
    }
  }
  if (!Number.isSafeInteger(data.order) || data.order < 0) invalid(filename, '"order" must be a non-negative integer.');
  if (typeof data.published !== 'boolean') invalid(filename, '"published" must be true or false, without quotes.');
  record.order = data.order;
  record.published = data.published;
  if (!Array.isArray(data.sources) || data.sources.length === 0) invalid(filename, '"sources" must contain at least one {"title", "url"} entry.');
  record.sources = data.sources.map((source, index) => {
    const field = `sources[${index}]`;
    if (!source || Array.isArray(source) || typeof source !== 'object') invalid(filename, `"${field}" must be an object with title and url.`);
    if (Object.keys(source).some((key) => !['title', 'url'].includes(key))) invalid(filename, `"${field}" supports only title and url.`);
    const title = requireText(source.title, `${field}.title`, filename);
    const url = requireText(source.url, `${field}.url`, filename);
    let parsed;
    try { parsed = new URL(url); } catch { invalid(filename, `"${field}.url" must be an absolute HTTPS URL.`); }
    if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) {
      invalid(filename, `"${field}.url" must be an absolute HTTPS URL without credentials.`);
    }
    return { title, url };
  });
  if (data.sourceNote !== undefined) record.sourceNote = requireText(data.sourceNote, 'sourceNote', filename);
  record.body = requireText(match[2], 'Markdown body', filename);
  return record;
}

/** Validate all entries, including drafts, then return only published entries. */
export async function readStrategies(rootDir = defaultRoot) {
  const root = path.resolve(rootDir);
  const contentDir = path.join(root, 'content', 'strategies');
  let names;
  try { names = await readdir(contentDir); } catch {
    throw new Error('Missing content/strategies/. Add one Markdown file per strategy.');
  }
  const filenames = names.filter((name) => name.endsWith('.md')).sort();
  if (!filenames.length) throw new Error('No strategy files found in content/strategies/. Start with templates/strategy.md.');
  const records = [];
  const slugs = new Map();
  for (const filename of filenames) {
    const sourcePath = path.join(contentDir, filename);
    const label = `content/strategies/${filename}`;
    const record = parseStrategy(await readFile(sourcePath, 'utf8'), label);
    if (slugs.has(record.slug)) invalid(label, `Duplicate slug "${record.slug}" also used by ${slugs.get(record.slug)}.`);
    slugs.set(record.slug, filename);
    records.push({ filename, label, record });
  }
  for (const { filename, label, record } of records) {
    if (filename !== `${record.slug}.md`) invalid(label, `Filename must match slug: rename it to ${record.slug}.md.`);
    for (const image of [record.image, record.gameImage].filter(Boolean)) {
      const imagePath = path.join(root, image);
      let resolvedImage;
      let imageStats;
      try {
        [resolvedImage, imageStats] = await Promise.all([realpath(imagePath), stat(imagePath)]);
      } catch {
        invalid(label, `Image not found: ${image}. Upload the PNG before publishing or saving a draft.`);
      }
      const resolvedItems = await realpath(path.join(root, 'assets', 'items'));
      const relativeImage = path.relative(resolvedItems, resolvedImage);
      if (relativeImage.startsWith('..') || path.isAbsolute(relativeImage) || !imageStats.isFile()) {
        invalid(label, `Image must resolve to a file inside assets/items/: ${image}.`);
      }
    }
  }
  return records.map(({ record }) => record)
    .filter((record) => record.published)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'en') || a.slug.localeCompare(b.slug));
}

/** Build a portable site that also works at a GitHub Pages repository subpath. */
export async function buildSite(rootDir = defaultRoot) {
  const root = path.resolve(rootDir);
  const strategies = await readStrategies(root);
  const entryFiles = ['index.html', 'styles.css', 'app.js'];
  for (const filename of entryFiles) {
    try {
      if (!(await stat(path.join(root, filename))).isFile()) throw new Error();
    } catch { throw new Error(`Missing site entry file: ${filename}. Add it before building.`); }
  }
  const serialized = `${JSON.stringify(strategies, null, 2)}\n`;
  const outputDir = path.join(root, 'dist');
  await mkdir(path.join(root, 'data'), { recursive: true });
  await writeFile(path.join(root, 'data', 'strategies.json'), serialized);
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(path.join(outputDir, 'data'), { recursive: true });
  await writeFile(path.join(outputDir, 'data', 'strategies.json'), serialized);
  for (const filename of entryFiles) await cp(path.join(root, filename), path.join(outputDir, filename));
  // Keep authoring records in the repository; deploy only public asset files.
  // Font license files are intentionally retained alongside their fonts.
  const authoringFiles = new Set(['provenance.json', 'README.md']);
  await cp(path.join(root, 'assets'), path.join(outputDir, 'assets'), {
    recursive: true,
    filter: (source) => !authoringFiles.has(path.basename(source)),
  });
  await writeFile(path.join(outputDir, '.nojekyll'), '');
  return { strategies, outputDir };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { strategies, outputDir } = await buildSite();
    console.log(`Built ${strategies.length} published strategies → ${outputDir}`);
  } catch (error) {
    console.error(`Build failed: ${error.message}`);
    process.exitCode = 1;
  }
}
