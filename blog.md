---
layout: page
title: Writing
permalink: /blog/
---

{% assign years = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
{% for year in years %}
<section class="year-group">
  <h2 class="year">{{ year.name }}</h2>
  <ul class="post-list post-list--full">
    {% for post in year.items %}
    <li>
      <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%b %-d" }}</time>
      <div>
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        <p>{{ post.excerpt | strip_html | truncate: 160 }}</p>
      </div>
    </li>
    {% endfor %}
  </ul>
</section>
{% endfor %}
