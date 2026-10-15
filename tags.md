---
layout: page
title: Tags
permalink: /tags/
---

{% assign tags = site.tags | sort %}
<p class="tag-cloud">
  {% for tag in tags %}<a href="#{{ tag[0] | slugify }}" class="tag">#{{ tag[0] }} <small>{{ tag[1].size }}</small></a>{% endfor %}
</p>

{% for tag in tags %}
<section class="year-group" id="{{ tag[0] | slugify }}">
  <h2 class="year">#{{ tag[0] }}</h2>
  <ul class="post-list">
    {% for post in tag[1] %}
    <li>
      <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%b %Y" }}</time>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
    </li>
    {% endfor %}
  </ul>
</section>
{% endfor %}
