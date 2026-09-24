'use strict';
const $ = (selector) => document.querySelector(selector);
const grid = $('#card-grid');
const dialog = $('#strategy-dialog');
let strategies = [];
const gameStyle = new URLSearchParams(location.search).get('style') !== 'classic';
document.body.dataset.cardStyle = gameStyle ? 'game' : 'classic';
document.title = `${gameStyle ? 'B · Game Cards' : 'A · Watercolor'} — Strategy Library`;
let previousFocus = null;
// Keep navigation on the surrounding Wix site when the library is embedded.
if (window.self !== window.top) {
  document.querySelectorAll('.site-header a[href^="https://"]').forEach((link) => { link.target = '_top'; });
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function imageFor(strategy) {
  const image = element('img');
  image.src = gameStyle && strategy.gameImage ? strategy.gameImage : strategy.image;
  image.alt = strategy.itemName;
  image.width = gameStyle && strategy.gameImage ? 1122 : 1448;
  image.height = gameStyle && strategy.gameImage ? 1402 : 1086;
  image.loading = 'lazy';
  image.decoding = 'async';
  return image;
}

function renderCards() {
  grid.replaceChildren();
  strategies.forEach((strategy) => {
    const card = element('article', gameStyle ? 'strategy-card game-card' : 'strategy-card');
    const art = element('div', 'card-art');
    art.append(imageFor(strategy));
    const copy = element('div', 'card-copy');
    const title = element('h3', '', strategy.title);
    if (gameStyle) {
      const heading = element('div', 'game-heading');
      const plate = element('div', 'game-titleplate');
      plate.append(title);
      heading.append(plate, element('p', 'game-type', strategy.category));
      card.append(heading);
      const ornament = element('span', 'game-divider', '◆');
      ornament.setAttribute('aria-hidden', 'true');
      copy.append(ornament);
      const brief = element('p', 'card-brief', strategy.summary);
      brief.lang = 'th';
      copy.append(brief);
    } else {
      copy.append(title, element('p', 'category', strategy.category));
      const prompt = element('div', 'view-card', 'View card');
      prompt.setAttribute('aria-hidden', 'true');
      prompt.append(element('span', '', '→'));
      copy.append(prompt);
    }
    const button = element('button', 'card-open');
    button.type = 'button';
    button.dataset.strategy = strategy.slug;
    button.setAttribute('aria-label', `View ${strategy.title} card`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'strategy-dialog');
    button.addEventListener('click', () => {
      previousFocus = button;
      location.hash = `strategy/${strategy.slug}`;
    });
    card.append(art, copy);
    if (gameStyle) {
      const edition = element('p', 'game-edition', 'QUANTARA · STRATEGY');
      edition.setAttribute('aria-hidden', 'true');
      card.append(edition);
    }
    card.append(button);
    grid.append(card);
  });
  grid.setAttribute('aria-busy', 'false');
}

// A deliberately small Markdown reader. All author content is inserted as text,
// so raw HTML, embedded scripts and executable Markdown never run.
function appendCitedText(node, text, sources) {
  const pattern = /\[(\d+)\]/g;
  let start = 0;
  for (const match of text.matchAll(pattern)) {
    node.append(document.createTextNode(text.slice(start, match.index)));
    const source = sources[Number(match[1]) - 1];
    if (source) {
      const link = element('a', 'citation', match[0]);
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `Source ${match[1]}: ${source.title}`);
      node.append(link);
    } else node.append(document.createTextNode(match[0]));
    start = match.index + match[0].length;
  }
  node.append(document.createTextNode(text.slice(start)));
}

function renderMarkdown(body, sources) {
  const output = element('div', 'markdown');
  output.lang = 'th';
  let paragraph = [];
  let list = null;
  const cited = (tag, text) => { const node = element(tag); appendCitedText(node, text, sources); return node; };
  const flush = () => { if (paragraph.length) output.append(cited('p', paragraph.join(' '))); paragraph = []; };
  for (const line of body.split(/\r?\n/)) {
    if (/^#{1,3}\s/.test(line)) { flush(); list = null; output.append(element('h3', '', line.replace(/^#{1,3}\s+/, ''))); }
    else if (/^[-*]\s/.test(line)) { flush(); if (!list) { list = element('ul'); output.append(list); } list.append(cited('li', line.replace(/^[-*]\s+/, ''))); }
    else if (!line.trim()) { flush(); list = null; }
    else { list = null; paragraph.push(line.trim()); }
  }
  flush();
  return output;
}

function showDetails(strategy) {
  if (!dialog.open && (!previousFocus?.isConnected || previousFocus === document.body)) {
    previousFocus = [...grid.querySelectorAll('.card-open')].find((button) => button.dataset.strategy === strategy.slug) || $('#collection');
  }
  const layout = element('div', 'detail-layout');
  const art = element('aside', 'detail-art');
  const figure = element('figure');
  figure.append(imageFor(strategy), element('figcaption', '', strategy.itemName), element('p', '', strategy.itemOrigin));
  const lore = element('div', 'detail-lore');
  lore.append(element('p', 'concept-label', 'QUANTARA · ITEM CONCEPT'));
  const loreText = element('p', '', strategy.itemLore); loreText.lang = 'th'; lore.append(loreText);
  art.append(figure, lore);
  const main = element('div', 'detail-main');
  const title = element('h2', '', strategy.title); title.id = 'detail-title';
  const summary = element('p', 'detail-summary', strategy.summary); summary.lang = 'th';
  main.append(element('p', 'category', strategy.category), title, summary, renderMarkdown(strategy.body, strategy.sources));
  const sources = element('section', 'sources');
  sources.append(element('h3', '', 'Research sources'));
  for (const [index, source] of strategy.sources.entries()) {
    const link = element('a', '', `[${index + 1}] ${source.title} ↗`);
    link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    sources.append(link);
  }
  if (strategy.sourceNote) { const note = element('p', 'source-note', strategy.sourceNote); note.lang = 'th'; sources.append(note); }
  sources.append(element('p', 'detail-disclaimer', 'Educational overview. No backtest or performance claim. Item names and stories are proposed game concepts.'));
  main.append(sources); layout.append(art, main);
  $('#dialog-content').replaceChildren(layout);
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  $('#close-dialog').focus({preventScroll:true});
}

function route() {
  const slug = location.hash.startsWith('#strategy/') ? location.hash.slice(10) : '';
  const strategy = strategies.find((s) => s.slug === slug);
  if (strategy) showDetails(strategy);
  else if (dialog.open) dialog.close();
}

function closeDetails() {
  if (location.hash.startsWith('#strategy/')) history.replaceState(null, '', `${location.pathname}${location.search}#collection`);
  if (dialog.open) dialog.close();
}

dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeDetails(); });
dialog.addEventListener('close', () => { const target = previousFocus; previousFocus = null; if (target?.isConnected) target.focus({preventScroll:true}); });
dialog.addEventListener('click', (event) => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDetails(); } });
$('#close-dialog').addEventListener('click', closeDetails);
window.addEventListener('hashchange', route);

async function load() {
  $('#error-state').hidden = true;
  grid.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('data/strategies.json');
    if (!response.ok) throw new Error('Catalog response failed');
    strategies = await response.json();
    if (!Array.isArray(strategies)) throw new Error('Invalid catalog');
    renderCards(); route();
  } catch (error) {
    grid.setAttribute('aria-busy', 'false');
    $('#error-state').hidden = false;
    console.error('Strategy collection failed to load:', error);
  }
}
$('#retry').addEventListener('click', load);
load();
