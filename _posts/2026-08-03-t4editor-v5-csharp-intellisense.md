---
layout: post
title: "T4Editor v5: C# IntelliSense Finally Comes to T4 Templates"
date: 2026-08-03 12:00:00 +0000
tags: [t4-templates, dotnet, csharp, visual-studio, roslyn, intellisense, vsix]
excerpt: "T4Editor now has Roslyn-powered C# IntelliSense, syntax highlighting, and error diagnostics inside T4 code blocks. Here's how it works."
---

Two years ago, I wrote about [source generators potentially replacing T4 templates]({% post_url 2024-02-25-source-generators-vs-t4 %}). One of the biggest arguments against T4 was the editing experience. You were basically writing C# in a plain text editor. No IntelliSense, no error squiggles, no syntax highlighting inside code blocks.

That changes today with **T4Editor v5**.

<!--more-->

## The Problem

If you've worked with T4 templates, you know the pain. You open a `.tt` file, start typing C# inside a `<# #>` block, and... nothing. No completions, no red squiggles when you mistype a method name, no colored keywords. You're flying blind. The only way to know if your code works is to run the template and see if it blows up.

T4Editor has had syntax highlighting for T4 block types since its first release, so you could tell control blocks from directives from expressions. But the C# code inside those blocks was just a wall of one color.

## What Changed

T4Editor v5 adds full **Roslyn-powered C# language services** inside T4 code blocks. When you type C# inside `<# #>`, `<#+ #>`, or `<#= #>` blocks, you now get:

- **C# IntelliSense**: real type and member completion powered by Roslyn's `CompletionService`
- **Syntax highlighting**: keywords, types, strings, numbers, comments all colored according to your VS theme
- **Error diagnostics**: red squiggles for compilation errors, mapped back to their exact position in the T4 source

The completions are context-aware: inside a code block you get C# suggestions, outside you get T4 snippet suggestions (`<#...#>`, `<#+...#>`, etc.).

## How It Works Under the Hood

The approach is pretty straightforward, but it took some careful work to get right. Here's the architecture:

### 1. Document Generation

When you open a `.tt` file, T4Editor parses all T4 blocks and stitches the C# content into a **valid, compilable C# document**:

```csharp
// Import directives become:
using System;
using System.Linq;

namespace T4Generated {
    class Template {
        public string TransformText() {
            // <# control blocks #> are placed here
            Write(/* <#= expressions #> */);
        }
        // <#+ class feature blocks #> are placed here

        void Write(object value) { }
    }
}
```

The generator keeps **bidirectional span mappings** so for every piece of C# code, it knows where it came from in the `.tt` file and the other way around. This is what makes it possible to map completions and errors back to the right position.

### 2. Roslyn Workspace

The generated C# document is registered in a Roslyn `AdhocWorkspace` with framework references (mscorlib, System, System.Core, etc.). This gives us a full `Document` that Roslyn's language services can analyze.

### 3. Position Mapping

When you trigger IntelliSense at position 47 in your `.tt` file, T4Editor:

1. Checks if position 47 falls inside a C# code block
2. Maps it to the corresponding position in the generated C# document
3. Queries Roslyn's `CompletionService` at that mapped position
4. Returns the results to Visual Studio's completion UI

The same mapping works in reverse for diagnostics. Roslyn reports an error at position 120 in the generated document, T4Editor maps it back to position 47 in the `.tt` file, and you see the squiggle where it belongs.

### 4. Performance

Everything is debounced. When you type, the regeneration of the C# document waits 300ms for you to stop typing before it re-parses. Diagnostic updates wait 500ms. The Roslyn workspace update is fast because we only replace the document text, not the entire project.

## The Completion Sources Are Context-Aware

This was a subtle but important detail. T4Editor has always had snippet completions for T4 constructs (typing `<#` would suggest control blocks, class features, etc.). With v5, both completion sources need to work together without stepping on each other.

The fix: each completion source checks whether the caret is inside a C# code block. If it is, only the Roslyn source kicks in. If not (you're in output text), only the T4 snippet source runs.

```csharp
// In the T4 snippet completion source:
void AugmentCompletionSession(ICompletionSession session, ...)
{
    if (IsInsideCSharpBlock(session))
        return; // Let the Roslyn source handle this

    // ... offer T4 snippets
}
```

## C# Syntax Highlighting

On top of all that, C# code inside T4 blocks now gets proper syntax coloring. Keywords are blue, strings are red/brown, types are teal, whatever your VS theme uses. This works by querying Roslyn's `Classifier.GetClassifiedSpansAsync` on the generated document and mapping the classified spans back to the T4 buffer.

The classifier is ordered to run *after* the base T4 classifier, so C# colorization layers on top of the T4 block background colors. The result is that you can immediately distinguish a `foreach` keyword from a variable name inside a control block.

## T4 Is Not Dead

T4 templates are still used all over the place. They generate Entity Framework models, API clients, configuration files, and anything that isn't strictly C# output. Source generators are great for C#-to-C# generation, but T4 is still the go-to when you need to generate XML, SQL, HTML, or any arbitrary text.

The editing experience was always the weak point. With proper C# language services, T4 templates become a lot more practical to work with in 2026.

## Try It

T4Editor is available on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=TimMaes.t4editor) and the source is on [GitHub](https://github.com/Tim-Maes/T4Editor).

---

*If you're still using T4 templates, I'd love to hear about your use cases. [Open an issue](https://github.com/Tim-Maes/T4Editor/issues) with feedback or feature requests.*
