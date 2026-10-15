---
layout: page
title: Projects
permalink: /projects/
---

Developer tools, libraries and extensions I've built to solve real problems, mostly around .NET, code generation and Blazor.

<div class="stats-grid">
  <div class="stat"><strong>1.1M+</strong><span>NuGet downloads</span></div>
  <div class="stat"><strong data-stat="stars">1.6k+</strong><span>GitHub stars</span></div>
  <div class="stat"><strong>50K+</strong><span>VS Marketplace installs</span></div>
  <div class="stat"><strong>15+</strong><span>Open source projects</span></div>
</div>

<h2 class="projects-heading">Libraries</h2>

<div class="project-grid">
  <div class="project-card">
    <h3><a href="https://github.com/Tim-Maes/Facet">Facet</a> <span class="star-count">1.2k ★</span></h3>
    <p>Source generator for DTOs, mappings, constructors and LINQ projections from your domain models. Zero runtime overhead.</p>
    <div class="tags"><span class="tag">Source Generators</span><span class="tag">EF Core</span></div>
    <div class="project-links"><a href="https://github.com/Tim-Maes/Facet">GitHub</a><a href="https://www.nuget.org/packages/Facet">NuGet</a><a href="/blog/2025/09/28/facets-in-dotnet/">Blog</a></div>
  </div>
  <div class="project-card">
    <h3><a href="https://github.com/Tim-Maes/Facet.Search">Facet.Search</a> <span class="star-count">46 ★</span></h3>
    <p>Source-generated models for faceted search and aggregations. Type-safe filters translated to SQL via EF Core.</p>
    <div class="tags"><span class="tag">Source Generators</span><span class="tag">Search</span></div>
    <div class="project-links"><a href="https://github.com/Tim-Maes/Facet.Search">GitHub</a><a href="/blog/2025/12/15/faceted-search/">Blog</a></div>
  </div>
  <div class="project-card">
    <h3><a href="https://github.com/Tim-Maes/BlazorFrame">BlazorFrame</a> <span class="star-count">70 ★</span></h3>
    <p>Security-first iframe component for Blazor with origin validation, sandbox controls and CSP integration.</p>
    <div class="tags"><span class="tag">Blazor</span><span class="tag">Security</span></div>
    <div class="project-links"><a href="https://github.com/Tim-Maes/BlazorFrame">GitHub</a><a href="https://www.nuget.org/packages/BlazorFrame">NuGet</a><a href="/blog/2025/09/13/blazorframe-enhanced-iframes/">Blog</a></div>
  </div>
  <div class="project-card">
    <h3><a href="https://github.com/Tim-Maes/Bindicate">Bindicate</a> <span class="star-count">35 ★</span></h3>
    <p>Attribute-based autowiring for .NET dependency injection, with support for decorators and keyed services.</p>
    <div class="tags"><span class="tag">DI</span><span class="tag">.NET</span></div>
    <div class="project-links"><a href="https://github.com/Tim-Maes/Bindicate">GitHub</a><a href="https://www.nuget.org/packages/Bindicate">NuGet</a></div>
  </div>
  <div class="project-card">
    <h3><a href="https://github.com/Tim-Maes/ArrayExtensions">ArrayExtensions</a> <span class="star-count">23 ★</span></h3>
    <p>A collection of 245 extension methods for C# arrays.</p>
    <div class="tags"><span class="tag">C#</span><span class="tag">Utilities</span></div>
    <div class="project-links"><a href="https://github.com/Tim-Maes/ArrayExtensions">GitHub</a></div>
  </div>
</div>

<h2 class="projects-heading">Developer tools &amp; extensions</h2>

<div class="project-grid">
  <div class="project-card">
    <h3><a href="https://marketplace.visualstudio.com/items?itemName=TimMaes.t4editor">T4Editor</a> <span class="star-count">52 ★</span></h3>
    <p>Visual Studio extension with syntax highlighting, Roslyn-powered C# IntelliSense and diagnostics for T4 templates. VS 2019/2022/2026.</p>
    <div class="tags"><span class="tag">VS Extension</span><span class="tag">T4</span></div>
    <div class="project-links"><a href="https://github.com/Tim-Maes/T4Editor">GitHub</a><a href="https://marketplace.visualstudio.com/items?itemName=TimMaes.t4editor">Marketplace</a><a href="/blog/2026/08/03/t4editor-v5-csharp-intellisense/">Blog</a></div>
  </div>
  <div class="project-card">
    <h3><a href="https://marketplace.visualstudio.com/items?itemName=TimMaes.t4executer">T4Executer</a> <span class="star-count">21 ★</span></h3>
    <p>Visual Studio extension to control which T4 templates run on build, and when.</p>
    <div class="tags"><span class="tag">VS Extension</span><span class="tag">Build</span></div>
    <div class="project-links"><a href="https://github.com/Tim-Maes/T4Executer">GitHub</a><a href="https://marketplace.visualstudio.com/items?itemName=TimMaes.t4executer">Marketplace</a></div>
  </div>
  <div class="project-card">
    <h3><a href="https://github.com/Tim-Maes/BlazorSnap">BlazorSnap</a> <span class="star-count">60 ★</span></h3>
    <p>Browser extension that converts any element on a page into a Blazor component stub. Chrome &amp; Edge.</p>
    <div class="tags"><span class="tag">Browser Extension</span><span class="tag">Blazor</span></div>
    <div class="project-links"><a href="https://github.com/Tim-Maes/BlazorSnap">GitHub</a></div>
  </div>
  <div class="project-card">
    <h3><a href="https://github.com/Tim-Maes/Schemer">Schemer</a> <span class="star-count">12 ★</span></h3>
    <p>Single-file .NET script for database schema comparison and migration generation across PostgreSQL, MySQL, SQL Server and SQLite.</p>
    <div class="tags"><span class="tag">Databases</span><span class="tag">CLI</span></div>
    <div class="project-links"><a href="https://github.com/Tim-Maes/Schemer">GitHub</a></div>
  </div>
  <div class="project-card">
    <h3><a href="https://github.com/Tim-Maes/PrintZPL">PrintZPL</a> <span class="star-count">28 ★</span></h3>
    <p>Send ZPL templates to Zebra label printers over TCP/IP, with data binding and batch printing.</p>
    <div class="tags"><span class="tag">REST API</span><span class="tag">Printing</span></div>
    <div class="project-links"><a href="https://github.com/Tim-Maes/PrintZPL">GitHub</a></div>
  </div>
  <div class="project-card">
    <h3><a href="https://github.com/Tim-Maes/AutoTerminal">AutoTerminal</a></h3>
    <p>Visual Studio extension to open a terminal in any folder straight from the Solution Explorer context menu.</p>
    <div class="tags"><span class="tag">VS Extension</span></div>
    <div class="project-links"><a href="https://github.com/Tim-Maes/AutoTerminal">GitHub</a></div>
  </div>
</div>

<h2 class="projects-heading">Templates &amp; experiments</h2>

<div class="project-grid">
  <div class="project-card">
    <h3><a href="https://github.com/Tim-Maes/GraphR">GraphR</a> <span class="star-count">24 ★</span></h3>
    <p>.NET solution template for a GraphQL API on Dapper, built with Clean Architecture, DDD and CQRS in mind.</p>
    <div class="tags"><span class="tag">GraphQL</span><span class="tag">Template</span></div>
    <div class="project-links"><a href="https://github.com/Tim-Maes/GraphR">GitHub</a></div>
  </div>
  <div class="project-card">
    <h3><a href="https://github.com/Tim-Maes/BlazorPwaKit">BlazorPwaKit</a></h3>
    <p>A dedicated Progressive Web App kit for Blazor apps.</p>
    <div class="tags"><span class="tag">Blazor</span><span class="tag">PWA</span></div>
    <div class="project-links"><a href="https://github.com/Tim-Maes/BlazorPwaKit">GitHub</a></div>
  </div>
</div>

<div class="projects-cta">
  <p>Like what you see? Follow along on GitHub or get in touch.</p>
  <a href="https://github.com/Tim-Maes" class="btn btn-primary">Follow on GitHub</a>
  <a href="mailto:tim.maes91@gmail.com" class="btn btn-outline">Get in touch</a>
</div>

<script>
(function () {
  function fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  var cards = Array.prototype.slice.call(document.querySelectorAll('.project-card'));

  // GitHub stars (one request for all repos)
  fetch('https://api.github.com/users/Tim-Maes/repos?per_page=100')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (repos) {
      var stars = {}, total = 0;
      repos.forEach(function (r) { if (!r.fork) { stars[r.name.toLowerCase()] = r.stargazers_count; total += r.stargazers_count; } });
      cards.forEach(function (card) {
        var gh = card.querySelector('.project-links a[href*="github.com/Tim-Maes/"]');
        if (!gh) return;
        var name = gh.href.split('/').pop().toLowerCase();
        if (!(name in stars) || !stars[name]) return;
        var h3 = card.querySelector('h3');
        var badge = h3.querySelector('.star-count');
        if (!badge) { badge = document.createElement('span'); badge.className = 'star-count'; h3.appendChild(badge); }
        badge.textContent = fmt(stars[name]) + ' \u2605';
      });
      var totalEl = document.querySelector('[data-stat="stars"]');
      if (totalEl) totalEl.textContent = fmt(total) + '+';
    })
    .catch(function () { /* keep static numbers */ });

  // NuGet downloads per package
  cards.forEach(function (card) {
    var nu = card.querySelector('.project-links a[href*="nuget.org/packages/"]');
    if (!nu) return;
    var id = nu.href.replace(/\/$/, '').split('/').pop();
    fetch('https://azuresearch-usnc.nuget.org/query?q=packageid:' + encodeURIComponent(id) + '&prerelease=true&semVerLevel=2.0.0')
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var pkg = res.data && res.data[0];
        if (!pkg || !pkg.totalDownloads) return;
        nu.textContent = 'NuGet \u00b7 ' + fmt(pkg.totalDownloads) + ' downloads';
      })
      .catch(function () {});
  });
})();
</script>
