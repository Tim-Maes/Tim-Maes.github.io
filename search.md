---
layout: page
title: Search
permalink: /search/
---

<input type="search" id="search-input" class="search-input" placeholder="Search posts..." autocomplete="off" autofocus>
<p class="search-status" id="search-status"></p>
<ul class="post-list post-list--full" id="search-results"></ul>

<script>
(function () {
  var input = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  var status = document.getElementById('search-status');
  var posts = [];

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  function run() {
    var q = input.value.trim().toLowerCase();
    var url = new URL(location);
    if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
    history.replaceState(null, '', url);

    results.innerHTML = '';
    if (!q) { status.textContent = ''; return; }

    var terms = q.split(/\s+/);
    var hits = posts.map(function (p) {
      var score = 0;
      var title = p.title.toLowerCase(), tags = p.tags.toLowerCase(), body = (p.excerpt + ' ' + p.content).toLowerCase();
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i], s = 0;
        if (title.indexOf(t) > -1) s += 10;
        if (tags.indexOf(t) > -1) s += 5;
        if (body.indexOf(t) > -1) s += 1;
        if (!s) return null;
        score += s;
      }
      return { p: p, score: score };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; });

    status.textContent = hits.length + (hits.length === 1 ? ' result' : ' results');
    results.innerHTML = hits.map(function (h) {
      return '<li><time>' + esc(h.p.date) + '</time><div><a href="' + h.p.url + '">' + esc(h.p.title) + '</a><p>' + esc(h.p.excerpt) + '</p></div></li>';
    }).join('');
  }

  fetch('{{ "/search.json" | relative_url }}')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      posts = data;
      var q = new URLSearchParams(location.search).get('q');
      if (q) input.value = q;
      run();
    });

  input.addEventListener('input', run);
})();
</script>
