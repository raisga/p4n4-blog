#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');

if (existsSync(DIST)) rmSync(DIST, { recursive: true });
mkdirSync(DIST, { recursive: true });

function parseFm(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = Object.fromEntries(
    m[1].split('\n')
      .filter(l => l.includes(':'))
      .map(l => {
        const i = l.indexOf(':');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
  return { meta, body: m[2] };
}

const fmtShort = iso => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
  year: 'numeric', month: 'short', day: 'numeric',
});
const fmtLong = iso => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
  year: 'numeric', month: 'long', day: 'numeric',
});

const indexTpl = readFileSync(join(ROOT, 'src', 'index.html'), 'utf8');
const postTpl  = readFileSync(join(ROOT, 'src', 'post.html'), 'utf8');

const posts = readdirSync(join(ROOT, 'posts'), { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(join(ROOT, 'posts', d.name, 'post.md')))
  .map(d => d.name)
  .sort()
  .reverse()
  .map(id => {
    const raw = readFileSync(join(ROOT, 'posts', id, 'post.md'), 'utf8');
    const { meta, body } = parseFm(raw);
    return { id, meta, body };
  });

// Generate one static HTML page per post
for (const post of posts) {
  const BASE   = '../../';
  const outDir = join(DIST, 'posts', post.id);
  mkdirSync(outDir, { recursive: true });

  const html    = marked.parse(post.body);
  const dateStr = post.meta.date ? fmtLong(post.meta.date) : '';
  const dateHtml = dateStr ? `<div class="post-date">${dateStr}</div>` : '';

  const page = postTpl
    .replace(/\{\{BASE\}\}/g,      BASE)
    .replace(/\{\{TITLE\}\}/g,     post.meta.title || 'Untitled')
    .replace(/\{\{DATE_HTML\}\}/g, dateHtml)
    .replace(/\{\{ID\}\}/g,        post.id)
    .replace(/\{\{CONTENT\}\}/g,   html);

  writeFileSync(join(outDir, 'index.html'), page);

  // Copy post media if present: posts/{id}/media/ → dist/posts/{id}/media/
  const mediaSrc = join(ROOT, 'posts', post.id, 'media');
  if (existsSync(mediaSrc)) {
    cpSync(mediaSrc, join(outDir, 'media'), { recursive: true });
  }
}

// Generate static index listing all posts
const listHtml = posts.length
  ? `<p class="index-label">entries</p>
<ul class="post-list">
  ${posts.map(p => `
  <li class="post-item">
    <a class="post-link" href="posts/${p.id}/">
      <div class="post-info">
        <div class="post-date">${p.meta.date ? fmtShort(p.meta.date) : ''}</div>
        <div class="post-title">${p.meta.title || 'Untitled'}</div>
        ${p.meta.excerpt ? `<div class="post-excerpt">${p.meta.excerpt}</div>` : ''}
      </div>
    </a>
  </li>`).join('')}
</ul>`
  : '<p class="msg">no posts yet.</p>';

const indexPage = indexTpl
  .replace(/\{\{BASE\}\}/g,       '')
  .replace(/\{\{POSTS_LIST\}\}/g, listHtml);

writeFileSync(join(DIST, 'index.html'), indexPage);

// Copy static assets
cpSync(join(ROOT, 'src', 'css'), join(DIST, 'css'), { recursive: true });

console.log(`built ${posts.length} post${posts.length !== 1 ? 's' : ''} → dist/`);
