---
layout: home
title: Home
---

<div class="hero-section">
  <div class="hero-content">
    <img src="/assets/images/TimMountain.png" alt="Tim Maes" class="profile-image">
    <div class="hero-text">
      <h1>Hi, I'm Tim Maes</h1>
      <p class="tagline">.NET Developer | Software Engineer | Tech Enthusiast</p>
      <p class="intro">
        I'm a passionate software developer specializing in .NET technologies. 
        I love building clean, maintainable solutions and sharing what I learn along the way.
      </p>
      <div class="hero-buttons">
        <a href="/blog/" class="btn btn-primary">Read My Blog</a>
        <a href="/projects/" class="btn btn-secondary">View Projects</a>
        <a href="/resume/" class="btn btn-secondary">My Resume</a>
      </div>
    </div>
  </div>
</div>

<section class="recent-posts">
  <h2>Latest Posts</h2>
  <div class="posts">
    {% for post in site.posts limit:3 %}
      <article class="post-card">
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%B %d, %Y" }}</time>
        {% if post.tags %}
          <div class="tags">
            {% for tag in post.tags limit:3 %}
              <span class="tag">{{ tag }}</span>
            {% endfor %}
          </div>
        {% endif %}
        <p>{{ post.excerpt }}</p>
        <a href="{{ post.url | relative_url }}" class="read-more">Read more !</a>
      </article>
    {% endfor %}
  </div>
  <div class="view-all">
    <a href="/blog/" class="btn btn-outline">View All Posts</a>
  </div>
</section>
