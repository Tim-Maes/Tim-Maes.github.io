---
layout: page
title: Blog
permalink: /blog/
---

# All Blog Posts

<div class="posts-list">
  {% for post in site.posts %}
    <article class="post-item">
      <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%B %d, %Y" }}</time>
      {% if post.tags %}
        <div class="tags">
          {% for tag in post.tags %}
            <span class="tag">{{ tag }}</span>
          {% endfor %}
        </div>
      {% endif %}
      <p>{{ post.excerpt }}</p>
      <a href="{{ post.url | relative_url }}" class="read-more">Read more</a>
    </article>
  {% endfor %}
</div>
