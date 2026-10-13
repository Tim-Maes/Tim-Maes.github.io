---
layout: post
title: "When the Code Writes Itself, What Is the Sprint For?"
date: 2026-10-13 00:00:00 +0000
tags: [ai, agents, spec-driven-development, scrum, agile, software-engineering]
excerpt: If AI agents can implement software faster than we can safely validate it, do our sprints still fit the work?
---

*If AI agents can implement software faster than we can safely validate it, do our sprints still fit the work?*

Last week I wrote a spec for a feature I'd have estimated at five story points a year ago. A couple of endpoints, some validation rules, a background job, the usual. I handed it to an agent, went to get coffee, and came back to a working implementation with tests.

Then I spent the rest of the afternoon figuring out whether it was actually *right*.

That afternoon is what I keep coming back to. Writing the code wasn't the hard part anymore. Trusting it was.

## The bottleneck moved

For as long as I've been doing this job, implementation has been the expensive part. Our whole process is built around that. We break work into stories, estimate how long they'll take to build, and plan sprints around how much code the team can write in two weeks.

With Spec-Driven Development and agentic coding, that assumption starts to wobble. An agent can produce a feature, a test suite and a migration in minutes. So what limits us now?

From what I've seen so far, it's things like:

- **Validation:** Does this do what we meant, not just what we wrote?
- **Review:** Somebody still has to read the diff, and a 2,000-line diff is not a quick read.
- **Integration:** Does it play nicely with the other five things that were also generated this week?
- **Clarity of the spec:** If the spec is vague, the agent will happily fill the gaps with confident guesses.

None of these get faster just because the code shows up faster. Some of them get *harder*.

## Do story points still mean anything?

Here's where it gets a bit uncomfortable. If a story that used to take three days now takes thirty minutes to implement, what are we estimating?

Maybe story points survive, but they start measuring something different: the effort to specify, review and verify, rather than the effort to build. Honestly, that might be closer to what they should have measured all along.

Velocity is trickier. If a team suddenly "completes" three times as many stories, is that progress, or just three times as much unverified code waiting to bite us in production? I'm not sure velocity tells us much when output is cheap.

## Test sprints?

One idea I've been toying with: what if sprints flipped? A short burst of implementation, followed by a longer stretch of testing, reviewing and integrating.

Part of me likes it. It's honest about where the time goes.

But another part of me thinks it's a step backwards. We spent years moving away from "build it, then throw it over the wall to QA." Separate test sprints sound suspiciously like a mini-waterfall wearing a Scrum hoodie.

Maybe the better answer is that validation just becomes continuous and *becomes the main work*. Not a phase. The thing we actually do all day.

## Smaller teams, different shapes

If one developer can orchestrate three or four agents working in parallel, do we still need a team of seven developers on a single product?

I can imagine teams getting smaller. I can also imagine that being a mistake. A big part of what a team gives you is multiple people who understand the system, can challenge each other's decisions and can cover when someone's on holiday. An agent doesn't sit in the retro and say "wait, why are we building this at all?"

Maybe teams don't shrink so much as change shape: fewer people writing code, more people thinking about specs, architecture and whether we're solving the right problem.

## So what does a developer do?

If I look at my own week, the shift is already happening. I write fewer lines of code and more specs. I spend more time on architecture decisions, because a bad boundary now gets replicated at machine speed. I review more. And I spend a lot more time asking "does this actually solve the user's problem?"

That last one was always the job, really. We just used to have the excuse of being busy typing.

I don't think Scrum is dead, and I don't think agile principles stop making sense. Short feedback loops matter even more when you can generate mistakes faster. But I do wonder whether the rituals we built around the cost of writing code still fit when that cost drops close to zero.

## Over to you

Is your team already feeling this? Have your sprints changed since agents started writing a real share of your code, or are you still planning as if humans type everything?

And if implementation keeps getting cheaper, what *should* a sprint be optimized for?

I'd genuinely like to hear how others are handling it.
