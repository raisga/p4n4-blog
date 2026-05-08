(async () => {
  const el = document.getElementById('posts-container');

  const fmt = (iso) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  try {
    const res = await fetch('posts/manifest.json');
    if (!res.ok) throw new Error();
    const posts = await res.json();

    if (!posts.length) {
      el.innerHTML = '<p class="msg">no posts yet.</p>';
      return;
    }

    el.innerHTML = `
      <p class="index-label">entries</p>
      <ul class="post-list">
        ${posts.map(p => `
          <li class="post-item">
            <a class="post-link" href="post.html?id=${p.id}">
              <div class="post-num">${p.id}</div>
              <div class="post-info">
                <div class="post-date">${fmt(p.date)}</div>
                <div class="post-title">${p.title}</div>
                ${p.excerpt ? `<div class="post-excerpt">${p.excerpt}</div>` : ''}
              </div>
            </a>
          </li>`).join('')}
      </ul>`;
  } catch {
    el.innerHTML = '<p class="msg">could not load posts.</p>';
  }
})();
