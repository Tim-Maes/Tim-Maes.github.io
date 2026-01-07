---
layout: post
title: "My thoughts on Vibe Coding as a Senior .NET Engineer"
date: 2026-01-07 12:00:00 +0000
tags: [ai, vibe-coding, agents, claude, dotnet, software-engineering]
---

# Thoughts on Vibe Coding as a Senior .NET Engineer

*My take on where we are, where we are headed, and how to stay relevant.*

---

I have been using Claude and other AI coding agents daily for a while now. As someone with over a decade of experience in .NET development, I have been watching the "vibe coding" phenomenon with a mix of fascination and professional curiosity. Here are my thoughts on the current state and what it means for us as engineers.

## The Assembly Language Parallel

Recently I came across a post from a veteran game developer with 27 years of experience who made an interesting comparison that really resonated with me. He compared the current state of AI coding to where assembly language was in the early days of game development.

Back then, if you were making shareware or freeware games independently, you could get by without knowing assembly. There were limitations of course. Many AAA games had too many sprites on the screen (and later 3D graphics) to work well without assembly optimizations. Very few studios would hire developers who did not know assembly.

Fast forward a few years and nobody cared if you knew assembly language anymore.

I expect this pattern to repeat with knowing how to code manually. And yes, I know developers will rightfully point out that compilers are deterministic while AI is probabilistic. But when the probabilities get high enough, the effective difference becomes negligible.

## Where Vibe Coding Breaks Down

Let me be clear: I am not saying we can vibe code everything today. It would be irresponsible to put enterprise level software used by millions on a 24/7 basis in the hands of a pure vibe coder. Just like you could not ship a AAA game without assembly back in the day.

But for prototypes, MVPs, internal tools, and smaller applications? The barrier to entry has never been lower. And the tech is only getting better.

## The Future of Software Itself

Here is where it gets interesting. We are headed towards a time when models get good enough and cheap enough that we will just ask them directly to solve the problems we create software for.

Think about it:

- I do not need a word processor, spreadsheet, or presentation software if I can give my data to a model and have it spit out a perfect annual report for my stakeholders
- I do not need Amazon's app to shop if I can just ask a model to search the web to find the best product at the best prices for my needs
- If I get tired of asking a model for edits, the model could generate an image editor on the fly tailored to my exact preferences based on what it knows about me

Software as we know it might become an implementation detail.

## How to Stay Ahead of the Curve

Until we reach that point (and I have no idea how long we have), I firmly believe that learning to properly design, engineer, and architect software will allow you to build increasingly complex applications that deliver value over what a frontier model can give you directly.

Here are my predictions for staying relevant:

### Be a Systems Thinker

Know what components are needed for an MVP: databases, APIs, containers, OAuth, message queues, caching layers. Depth is not necessary because the AI can cover for depth. You just need to know what is on the shopping list.

### Master Software Architecture

Modularity, testability, readability, maintainability, DRY. You need to be able to identify and avoid slop, because slop is technical debt. If AI automatically avoided slop, there would not be so many people complaining about it.

### Develop Context Engineering Skills

Be able to near one-shot a moderately complex feature. This means knowing how to structure your prompts, what context to provide, and when to ask the AI "what is unclear with my spec?" Keep iterating until it says everything is clear and you have a comprehensive spec that can guide the implementation.

### Stay Curious

Have an always-learning mindset because the landscape is changing at light speed. ChatGPT is only about 3 years old. Look at how much has changed in that time. The tools I use today are vastly different from what I used 6 months ago.

## The Skills That Actually Matter

What I find funny is that the skills needed to stay ahead are the same skills it has always been. Just without some of the more mundane aspects of tool use.

Critical thinking. Understanding systems. Knowing the tradeoffs. Being able to communicate requirements clearly. These are transdisciplinary skills that transfer across domains.

The best way to develop these skills is to go deep into one thing first. Without going deeply into something, the knowledge does not develop into more complex mental models. You need that foundation before you can abstract and apply it elsewhere.

## My Daily Workflow

I use Claude Code (& GitHub Copilot) nearly every single day. For anything user-facing or complex, I stay close to the code and do proper reviews. For boring internal tools on top of existing APIs and databases, I let the AI do the heavy lifting.

The runs where I treat it like a junior dev on the team go fine. The runs where I treat it like magic that will "handle it" end in pain.

Vibe coding is fun and can be productive, but only if you bring a real engineering mindset to it and treat the tools as power tools, not as a substitute for judgment.

## Looking Forward

I am personally shifting my focus to be more product and system-focused rather than just implementation. The more I use these tools, the less concerned I am about them entirely replacing devs. Even with agents doing all the coding, there is still so much work to do to get them to perform well, have the right context, and build a maintainable and scalable app.

The assembly analogy makes sense to me. Tools abstract away mechanics, but they do not remove the need to understand systems, limits, and tradeoffs. Vibe coding skips syntax, not responsibility.

Someone still has to decide what should exist, how it fits together, and what breaks when reality hits.
