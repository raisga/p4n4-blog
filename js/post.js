(async () => {
  const article = document.getElementById('post-article');
  const id = new URLSearchParams(location.search).get('id');

  if (!id) { location.href = 'index.html'; return; }

  article.innerHTML = '<p class="msg">loading…</p>';

  try {
    const res = await fetch(`posts/${id}.md`);
    if (!res.ok) throw new Error('not found');
    const raw = await res.text();

    const { meta, body } = parseFm(raw);
    if (meta.title) document.title = `${meta.title} — p4n4`;

    const dateStr = meta.date
      ? new Date(meta.date + 'T00:00:00').toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      : '';

    article.innerHTML = `
      <header class="post-header">
        <div class="post-watermark">${id}</div>
        <div class="post-eyebrow">${id}</div>
        <h1>${meta.title || 'Untitled'}</h1>
        ${dateStr ? `<div class="post-date">${dateStr}</div>` : ''}
      </header>
      <div class="prose">${marked.parse(body)}</div>`;
  } catch {
    article.innerHTML = '<p class="msg">post not found.</p>';
  }

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
})();
