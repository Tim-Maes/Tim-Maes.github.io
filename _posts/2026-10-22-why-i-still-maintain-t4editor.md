---
layout: post
title: "Why I Still Maintain T4Editor"
date: 2026-10-22 00:00:00 +0000
tags: [t4-templates, dotnet, visual-studio, code-generation, ai, agents, open-source]
excerpt: Why I keep a T4 template editor alive when AI agents can generate the code for you, and where T4 still earns its place.
---

*Why I keep a T4 template editor alive when AI agents can generate the code for you, and where T4 still earns its place.*

I still maintain T4Editor in 2026, and I plan to keep doing it. That wasn't an obvious call. AI agents now write a good share of the code I read, and T4 templates feel like a relic of the .NET Framework years.

So I asked myself the blunt version: why keep a T4 editor alive when you can ask an agent to generate the code directly? This post is my answer. T4 still does a job nothing else does as well, AI makes a good editor for it more useful rather than less, and keeping a small tool alive has never been cheaper.


## From regex highlighter to Roslyn-backed editor

T4Editor started somewhere in 2019 to fix one annoyance: Visual Studio shows `.tt` files as plain text. Seven years and about 150 commits later, it runs a hidden Roslyn workspace behind every open template.

I covered how that Roslyn layer works in the [T4Editor v5 post]({% post_url 2026-08-03-t4editor-v5-csharp-intellisense %}).

| When | What changed |
| --- | --- |
| Oct 2026 | Visual Studio 2026 support; fixes to C# mapping, threading and multi-view behavior |
| Aug 2026 | Roslyn-powered C# IntelliSense, coloring and error squiggles inside code blocks |
| Jul 2025 | Token-based parser replaces the regexes; reliable light/dark theme detection |
| Nov 2023 | Theme-aware default colors on first run |
| Feb 2023 | Colored T4 tags with their own background |
| Dec 2021 | Visual Studio 2022 support |
| Feb 2020 | Block snippets complete on Tab |
| Jun 2019 | Collapsible outlining for T4 blocks |
| May 2019 | First release: block highlighting, color settings, snippets, brace matching |

The pace was never steady. 2019 alone saw 72 commits; 2022 saw two. That rhythm is the honest shape of a side project.

## Where T4 still earns its place

T4 is not where new .NET code generation starts any more. Roslyn source generators run inside the compiler, work with SDK-style projects and `dotnet build`, and see your code as it compiles. If I were starting a generator today, that is where I would start.

I made that comparison back in 2024, in [Source generators vs T4]({% post_url 2024-02-25-source-generators-vs-t4 %}), and it still holds.

But T4 has strengths that never went away:

- **The output is ordinary, visible code.** A template writes a `.cs`, `.sql` or `.json` file you can open, diff and commit. Nothing is hidden in the compiler's memory.
- **It generates anything, not just C#.** Config files, SQL scripts, documentation, TypeScript clients: if it is text, a template can write it.
- **The same input gives the same output.** Run it twice, get the same file. Reviewers check the template once instead of every result.
- **It is already everywhere.** EF6 `.edmx` models, older .NET Framework applications and years of in-house generators are built on `.tt` files. That code is still running in production and someone still has to change it.

That last group is who T4Editor is for. They didn't choose T4 last week; they inherited it, and Visual Studio still shows their templates as plain text.

## Why AI makes a good editor more useful, not less

The argument against T4Editor goes like this: if an agent can write the code, nobody needs a template, and nobody needs an editor for one. I think it runs the other way.

**Ask the agent for the template, not the output.** An agent that writes 200 entity classes by hand writes them slightly differently each time you ask. An agent that writes one template gives you a generator that produces the same 200 classes on every run. You review one file instead of 200, and the next schema change is a re-run, not a new prompt.

**Someone still reads what the agent wrote.** A `.tt` file interleaves C# with the text it emits, and as plain text the two blur together. That is exactly where review breaks down. Separating them visually, coloring the C# properly and flagging compile errors before you run the template is what turns a template from something you trust blindly into something you can check.

Agents now write code faster than we can review it, as I argued in [Coffee Break Features and Afternoon-Long Reviews]({% post_url 2026-10-13-coffee-break-features-and-afternoon-long-reviews %}). Anything that makes review faster is worth more than it used to be.

**Old code is where agents need the most help from you.** Agents do best on code they can build and run. A legacy generator inside a .NET Framework solution is often neither. When you take over that work by hand, the editor is the difference between guessing and knowing what a block does.

## What maintaining it looks like now

T4Editor is in maintenance mode, on purpose. I am not chasing a full T4 host or VB support for a shrinking audience. I keep it installing on every new Visual Studio, fix what people report, and keep releases cheap.

AI changed the cost side of that equation as much as the value side. In October I had an agent review the codebase. In about an hour it found and fixed five real bugs in the new Roslyn layer: an off-by-one at the end of every code block, import directives colored at the wrong positions, stale colors while typing, the UI thread blocking on Roslyn, and C# features dying when you closed one of two views on the same file. Visual Studio 2026 support turned out to be a version range in the manifest. If the tools that make T4 look obsolete also make it nearly free to maintain, the math changes.

The rules I've set myself:

1. Every new Visual Studio release gets support within weeks.
2. Reported bugs get fixed; big new features need real demand behind them.
3. Releases go out through GitHub Actions, so shipping a fix costs minutes, not an evening. That pipeline is the next thing I'm setting up.
4. Every six months I look at installs and issues. If both fall to nothing, I archive the project with a clear note instead of letting it rot.

There is a personal reason too. T4Editor is a public piece of work with a real install base, and building it is how I learned the Visual Studio editor from the inside. That counts, even if the technology around it is fading.

## So, is it worth it?

For me, yes. T4 is not the future of code generation, but plenty of production code depends on it, and the people who maintain that code deserve a decent editor. AI didn't make that need go away. It made the templates more worth writing and the editor cheaper to keep alive.

If you work with `.tt` files:

- Install [T4Editor from the Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=TimMaes.t4editor). It supports Visual Studio 2019, 2022 and 2026.
- Report bugs and ideas on [GitHub](https://github.com/Tim-Maes/T4Editor/issues). Reports are what decide where my time goes.
- If it saves you time, [sponsoring on GitHub](https://github.com/sponsors/Tim-Maes) or [buying me a coffee](https://www.buymeacoffee.com/GRq3xSA) keeps it going.
