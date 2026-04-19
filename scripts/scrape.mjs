#!/usr/bin/env node
/**
 * One-shot scrape of mihuric.hr → MDX content collections.
 *
 * Reads the live WordPress sitemap, fetches every real page, extracts the
 * Enfold main content, converts HTML→Markdown, downloads images referenced
 * in the body, and writes MDX files with frontmatter into src/content/.
 *
 * Skipped URLs (known junk/leftover content):
 *   /sample-page/, /portfolio-item/*, /en/ (demo), /shop/, /cart/,
 *   /checkout/, /my-account/, /blog/
 *
 * Run:
 *   node scripts/scrape.mjs
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, basename, extname } from 'node:path';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'src', 'content');
const ASSETS_DIR = join(ROOT, 'src', 'assets');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36';

const SITEMAP = 'https://mihuric.hr/wp-sitemap-posts-page-1.xml';

const SKIP_PATTERNS = [
  /\/sample-page\/?$/,
  /\/portfolio-item\//,
  /\/en\/?$/,
  /\/shop\/?$/,
  /\/cart\/?$/,
  /\/checkout\/?$/,
  /\/my-account\/?$/,
  /\/blog\/?$/,
];

/**
 * Classification of each real URL into a content collection + slug/track/etc.
 * Populated by hand from the sitemap because the WP IA doesn't encode this.
 */
const ROUTING = [
  // courses
  { url: 'https://mihuric.hr/discovery-dives/',          collection: 'courses',    track: 'discovery',    slug: 'discovery' },
  { url: 'https://mihuric.hr/padi-recreational-courses/', collection: 'courses',   track: 'recreational', slug: 'recreational' },
  { url: 'https://mihuric.hr/padi-specialty-courses/',   collection: 'courses',    track: 'specialty',    slug: 'specialty' },
  { url: 'https://mihuric.hr/padi-pro/',                 collection: 'courses',    track: 'professional', slug: 'professional' },
  { url: 'https://mihuric.hr/padi-tec-courses/',         collection: 'courses',    track: 'tec',          slug: 'tec' },

  // FAQ
  { url: 'https://mihuric.hr/courses-faq/',              collection: 'faq', topic: 'courses',     slug: 'courses' },
  { url: 'https://mihuric.hr/diving-faq/',               collection: 'faq', topic: 'diving',      slug: 'diving' },
  { url: 'https://mihuric.hr/equipment-faq/',            collection: 'faq', topic: 'equipment',   slug: 'equipment' },
  { url: 'https://mihuric.hr/cost-and-payment-faq/',     collection: 'faq', topic: 'cost',        slug: 'cost' },
  { url: 'https://mihuric.hr/safety-and-health-faq/',    collection: 'faq', topic: 'safety',      slug: 'safety' },
  { url: 'https://mihuric.hr/vacationing-in-selce-faq/', collection: 'faq', topic: 'vacationing', slug: 'vacationing' },

  // top-level pages
  { url: 'https://mihuric.hr/',                          collection: 'pages', slug: 'home' },
  { url: 'https://mihuric.hr/our-story/',                collection: 'pages', slug: 'about' },
  { url: 'https://mihuric.hr/services/',                 collection: 'pages', slug: 'what-we-offer' },
  { url: 'https://mihuric.hr/diving-at-dc-mihuric/',     collection: 'pages', slug: 'what-we-offer-diving' },
  { url: 'https://mihuric.hr/weather-and-climate/',      collection: 'pages', slug: 'weather' },
  { url: 'https://mihuric.hr/media-center/',             collection: 'pages', slug: 'media' },
  { url: 'https://mihuric.hr/mihuric-web-cam-live/',     collection: 'pages', slug: 'webcam' },
  { url: 'https://mihuric.hr/contact/',                  collection: 'pages', slug: 'contact' },
  { url: 'https://mihuric.hr/sign-up/',                  collection: 'pages', slug: 'sign-up' },
];

// Everything else found in the sitemap is presumed to be a dive site.

const SITE_CATEGORIES = {
  reef: ['reef', 'hrid', 'kamenjak', 'mala-glavina', 'punta-silo', 'druzenjin', 'scerba'],
  wreck: ['shipwreck', 'wreck', 'peltastis', 'regolo', 'jakljan'],
  cave: ['cave', 'caves', 'cavern', 'tunnel', 'timos'],
  wall: ['zid', 'wall'],
  'house-reef': ['house-reef'],
};

function categoryFromSlug(slug) {
  for (const [cat, needles] of Object.entries(SITE_CATEGORIES)) {
    if (needles.some((n) => slug.includes(n))) return cat;
  }
  return 'reef';
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function downloadBinary(url, destPath) {
  const res = await fetch(url, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await mkdir(dirname(destPath), { recursive: true });
  await pipeline(Readable.fromWeb(res.body), createWriteStream(destPath));
}

function parseSitemap(xml) {
  const urls = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) urls.push(m[1]);
  return urls;
}

function slugFromUrl(url) {
  const u = new URL(url);
  const parts = u.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? 'home';
}

/**
 * The Enfold theme on mihuric.hr appends the same footer block to every
 * page body (CONTACT, ADDRESS, GPS, language switcher, "Scroll to top"),
 * so every scraped page ends up with duplicate boilerplate in its markdown.
 * Truncate at the first header that matches any of these markers.
 */
function stripFooterCruft(md) {
  const markers = [
    /\n#+\s*CONTACT\s*$/im,
    /\n#+\s*Contact\s*$/im,
    /\n#+\s*ADDRESS\s*$/im,
    /\n#+\s*Address\s*$/im,
    /\n#+\s*Choose your language\s*$/im,
    /\n#+\s*GPS\s*$/im,
    /\n\[Scroll to top\]/im,
  ];
  let cutAt = md.length;
  for (const re of markers) {
    const m = md.match(re);
    if (m && m.index !== undefined && m.index < cutAt) cutAt = m.index;
  }
  return md.slice(0, cutAt).trimEnd();
}

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
td.remove(['script', 'style', 'iframe', 'noscript']);
// Drop empty paragraphs and Enfold's specific cruft
td.addRule('removeEmptyLinks', {
  filter: (node) => node.nodeName === 'A' && !node.textContent.trim(),
  replacement: () => '',
});

function extractMain($) {
  // Enfold wraps page content in .entry-content, #main, .container_wrap, etc.
  // Try selectors in order of specificity.
  const candidates = [
    '.entry-content',
    '.template-page .entry-content',
    '#main .entry-content',
    '.post_content',
    '#main article',
    'main',
  ];
  for (const sel of candidates) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 80) return el;
  }
  // Fallback: strip header/footer and take body
  $('header, footer, nav, .cookie-script, #top_sub_menu, .main_menu').remove();
  return $('body');
}

function extractMetaDescription($) {
  const md = $('meta[name="description"]').attr('content');
  if (md) return md.trim();
  const og = $('meta[property="og:description"]').attr('content');
  if (og) return og.trim();
  const firstP = $('p').first().text().trim();
  return firstP.slice(0, 200);
}

function yaml(obj) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) { lines.push(`${k}: []`); continue; }
      lines.push(`${k}:`);
      for (const item of v) lines.push(`  - ${JSON.stringify(item)}`);
    } else if (typeof v === 'object') {
      lines.push(`${k}:`);
      for (const [kk, vv] of Object.entries(v)) lines.push(`  ${kk}: ${JSON.stringify(vv)}`);
    } else {
      lines.push(`${k}: ${JSON.stringify(v)}`);
    }
  }
  lines.push('---', '');
  return lines.join('\n');
}

function parseDepthString(str) {
  // Looks for "8-31 meters" / "8-31 m" / "8 to 31 meters"
  const m = str.match(/(\d{1,3})\s*(?:-|to|–)\s*(\d{1,3})\s*(?:m|meters)/i);
  if (!m) return null;
  return { min: Number(m[1]), max: Number(m[2]) };
}

function parseCertificationString(str) {
  if (/AOWD|advanced open water/i.test(str)) return 'Advanced Open Water';
  if (/\bOWD\b|\bopen water\b/i.test(str)) return 'Open Water';
  if (/rescue/i.test(str)) return 'Rescue';
  if (/divemaster/i.test(str)) return 'Divemaster';
  if (/tec\b|technical/i.test(str)) return 'Tec';
  return 'Open Water';
}

function decideCollection(url) {
  const match = ROUTING.find((r) => r.url === url || r.url === url.replace(/\/+$/, '/'));
  if (match) return match;
  return {
    url,
    collection: 'diveSites',
    slug: slugFromUrl(url),
  };
}

async function scrapePage(url, locale = 'en') {
  const html = await fetchText(url);
  const $ = cheerio.load(html);

  const title = ($('h1').first().text() || $('title').text())
    .replace(/\s*[–-]\s*Diving Center Mihurić.*$/, '')
    .trim();

  const description = extractMetaDescription($);
  const mainEl = extractMain($);
  const bodyText = mainEl.text();

  // Images — collect before converting to Markdown
  const images = [];
  mainEl.find('img').each((_, img) => {
    const src =
      $(img).attr('src') ||
      $(img).attr('data-src') ||
      $(img).attr('data-lazy-src') ||
      '';
    if (!src) return;
    const abs = new URL(src, url).toString();
    if (abs.includes('test.kriesi.at')) return; // skip demo hotlinks
    images.push(abs);
  });

  let markdown = td.turndown(mainEl.html() || '').trim();
  markdown = stripFooterCruft(markdown);

  return { title, description, markdown, images, bodyText };
}

async function downloadImages(urls, subdir) {
  const downloaded = [];
  for (const u of urls) {
    try {
      const name = basename(new URL(u).pathname).replace(/[^a-z0-9._-]/gi, '_');
      const dest = join(ASSETS_DIR, subdir, name);
      await downloadBinary(u, dest);
      downloaded.push({ src: u, relPath: `../../assets/${subdir}/${name}` });
    } catch (err) {
      console.warn(`  ! skipped image ${u}: ${err.message}`);
    }
  }
  return downloaded;
}

async function writeDiveSite(meta, scraped) {
  const { title, description, markdown, bodyText, images } = scraped;
  const slug = meta.slug;

  // Heuristically pull diving specs from body text.
  const depth = parseDepthString(bodyText) ?? { min: 0, max: 0 };
  const certification = parseCertificationString(bodyText);
  const category = categoryFromSlug(slug);

  const imgs = await downloadImages(images.slice(0, 8), `dive-sites/${slug}`);
  const hero = imgs[0]?.relPath;
  const gallery = imgs.slice(1).map((i) => i.relPath);

  const frontmatter = {
    title,
    slug,
    locale: 'en',
    summary: description || title,
    depth,
    certification,
    category,
    marineLife: [],
    hero,
    gallery,
    draft: false,
  };

  const file = join(CONTENT_DIR, 'dive-sites', `${slug}.en.mdx`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, yaml(frontmatter) + markdown + '\n');
  console.log(`  ✓ dive-sites/${slug}.en.mdx`);
}

async function writeCourse(meta, scraped) {
  const { title, description, markdown, images } = scraped;
  const slug = meta.slug;
  const imgs = await downloadImages(images.slice(0, 4), `courses/${slug}`);
  const frontmatter = {
    title,
    slug,
    locale: 'en',
    track: meta.track,
    summary: description || title,
    prerequisites: [],
    includes: [],
    hero: imgs[0]?.relPath,
    draft: false,
  };
  const file = join(CONTENT_DIR, 'courses', `${slug}.en.mdx`);
  await writeFile(file, yaml(frontmatter) + markdown + '\n');
  console.log(`  ✓ courses/${slug}.en.mdx`);
}

async function writeFaq(meta, scraped) {
  const { title, markdown } = scraped;
  const slug = meta.slug;
  const frontmatter = {
    title,
    slug,
    locale: 'en',
    topic: meta.topic,
    entries: [], // manually refined later; raw markdown kept in body for now
  };
  const file = join(CONTENT_DIR, 'faq', `${slug}.en.mdx`);
  await writeFile(file, yaml(frontmatter) + markdown + '\n');
  console.log(`  ✓ faq/${slug}.en.mdx`);
}

async function writePage(meta, scraped) {
  const { title, description, markdown, images } = scraped;
  const slug = meta.slug;
  const imgs = await downloadImages(images.slice(0, 3), `pages/${slug}`);
  const frontmatter = {
    title,
    slug,
    locale: 'en',
    description: description || title,
    hero: imgs[0]?.relPath,
    draft: false,
  };
  const file = join(CONTENT_DIR, 'pages', `${slug}.en.mdx`);
  await writeFile(file, yaml(frontmatter) + markdown + '\n');
  console.log(`  ✓ pages/${slug}.en.mdx`);
}

async function main() {
  console.log(`→ fetching sitemap ${SITEMAP}`);
  const xml = await fetchText(SITEMAP);
  const urls = parseSitemap(xml).filter((u) => !SKIP_PATTERNS.some((re) => re.test(u)));
  console.log(`→ ${urls.length} real URLs to process\n`);

  for (const url of urls) {
    const meta = decideCollection(url);
    try {
      console.log(`→ ${url}  (${meta.collection})`);
      const scraped = await scrapePage(url);
      switch (meta.collection) {
        case 'courses':    await writeCourse(meta, scraped);    break;
        case 'faq':        await writeFaq(meta, scraped);       break;
        case 'pages':      await writePage(meta, scraped);      break;
        case 'diveSites':
        default:           await writeDiveSite(meta, scraped);  break;
      }
    } catch (err) {
      console.error(`  ✗ ${url}: ${err.message}`);
    }
  }

  console.log('\n✓ done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
