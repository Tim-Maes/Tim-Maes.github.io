---
layout: post
title: ".NET Object Mapping & Source Generators in 2025: A Comprehensive Comparison"
date: 2025-11-06
categories: [dotnet, csharp, object-mapping, source-generators]
tags: [facet, automapper, mapperly, mapster, dto, source-generation]
---

## The Mapping Library Landscape Has Changed

If you're a .NET developer, you've probably used AutoMapper at some point. For over a decade, it's been the go-to solution for object-to-object mapping. But in April 2025, the landscape shifted significantly.

**AutoMapper transitioned to a commercial licensing model.**

Starting with version 15.0, AutoMapper now requires either a commercial license or compliance with the Reciprocal Public License 1.5 (RPL-1.5). This change has prompted many projects to reevaluate their mapping strategy.

Major frameworks like ABP have migrated to alternatives. The .NET community is actively discussing and comparing options.

In this post, I'll provide an objective comparison of the main .NET object mapping solutions available in late 2025, examining their approaches, features, and tradeoffs to help you make an informed decision for your projects.

**Important note:** This comparison includes both traditional mappers (AutoMapper, Mapster, Mapperly) and DTO generators (Facet). While traditional mappers assume you've written your DTOs and focus on mapping between them, Facet takes a different approach by generating your DTOs from source models with built-in mapping. Both solve related problems but with fundamentally different philosophies.

## The Contenders

Let's look at the four main players in the .NET mapping space:

### 1. AutoMapper (v15.1.0) - The Veteran Turned Commercial

**First released:** 2011
**Total downloads:** 296+ million
**Current status:** Commercial (April 2025)
**License:** Dual license (RPL-1.5 or Commercial)

AutoMapper pioneered convention-based object mapping in .NET. It's been the standard for over a decade, using runtime reflection to automatically map properties based on naming conventions. The library features convention-based mapping with fluent configuration, profile-based organization, custom resolvers and type converters, and `ProjectTo<>` for EF queries. It has a massive ecosystem and community built over its 14+ year history.

**Current considerations:** Commercial licensing may be a factor for some projects, and its reflection-based approach has different performance characteristics than compile-time alternatives.

### 2. Mapster (v7.4.0) - The Fast Alternative

**First released:** 2015
**Total downloads:** 7.4+ million
**Current status:** Uncertain future
**License:** MIT

Mapster emerged as a faster alternative to AutoMapper, using compile-time code generation to avoid reflection overhead. It promised 4x better performance while using only 1/3 of the memory. The library offers a compile-time code generation option, runtime adaptation with `TypeAdapter.Adapt<>()`, simple minimal configuration, and a good balance of performance and ease of use with support for flattening and projections.

**Current considerations:** Some community members have noted slower release cadence recently. Worth monitoring the project's activity if considering for new projects.

### 3. Mapperly (v4.3.0) - The Source Generator Rising Star

**First released:** ~2022
**Downloads:** Rapidly growing
**Current status:** Very active development
**License:** Apache 2.0

Mapperly is a pure Roslyn source generator that creates mapping code at compile time. It's currently the fastest mapper available, with performance essentially identical to hand-written code. The library provides zero runtime overhead through pure compile-time generation, full compile-time type safety, and transparent generated code you can inspect. It has active development and a growing community, and was notably chosen by ABP Framework after AutoMapper went commercial.

**Tradeoffs:** More explicit approach requires defining methods for each mapping direction. Some advanced scenarios require more manual configuration.

### 4. Facet (v3.3.0+) - The DTO Generator with Built-in Mapping

**First released:** ~2023
**Current status:** Active development with innovative features
**License:** MIT

Facet is fundamentally different from traditional mappers - it's a **DTO/model generator** that creates your DTOs at compile-time with mapping capabilities built in. Rather than mapping between existing DTOs, Facet generates the DTOs from source models via attributes.

The library offers attribute-based configuration that's simple and intuitive, generates DTOs/Facets from source models, provides bidirectional mapping with automatic `BackTo()` methods, handles nested objects automatically with `NestedFacets`, and includes advanced flattening with the `[Flatten]` attribute and FK clash detection. It also generates EF projections automatically, supports custom mapping logic via `IFacetMapConfiguration`, and uses pure source generation for zero runtime overhead.

**Philosophical difference:** While AutoMapper, Mapster, and Mapperly assume you've already defined your DTOs and focus on mapping between them, Facet generates the DTOs for you based on your source models, with mapping as an integrated feature.

## Head-to-Head Comparison

### Fundamental Approach Comparison

Before diving into features, it's important to understand the fundamental difference in what these libraries do:

| Library | Primary Purpose | You Define | Library Generates |
|---------|----------------|------------|-------------------|
| **AutoMapper** | Maps between existing classes | Both source & target classes | Runtime mapping logic |
| **Mapster** | Maps between existing classes | Both source & target classes | Compiled mapping logic |
| **Mapperly** | Maps between existing classes | Both source & target classes, plus mapper class | Mapper implementation |
| **Facet** | Generates DTOs from source models | Source model only | DTO class + mapping logic |

**Key Insight:** Facet is the only tool in this comparison that actually generates your DTO/model classes. The others assume you've already written both classes and focus purely on the mapping between them. This is a fundamentally different approach - Facet is a DTO generator with mapping, not a mapper with configuration.

Let's break down how these libraries stack up across key criteria:

### Performance Comparison

| Library | Speed | Memory | Approach |
|---------|-------|--------|----------|
| **Facet** | :zap::zap::zap: Fastest (source gen) | :green_heart: Minimal | Compile-time generation |
| **Mapperly** | :zap::zap::zap: Fastest (source gen) | :green_heart: Minimal | Compile-time generation |
| **Mapster** | :zap::zap: Fast | :yellow_heart: ~1/3 of AutoMapper | Hybrid (compile + runtime) |
| **AutoMapper** | :zap: Slowest | :heart: Highest | Runtime reflection |

**Analysis:** Source generation-based libraries (Facet, Mapperly) show similar performance characteristics, both offering minimal runtime overhead compared to reflection-based approaches.

### Feature Comparison

| Feature | AutoMapper | Mapster | Mapperly | **Facet** |
|---------|-----------|---------|----------|-----------|
| **Configuration Style** | Profiles + Fluent | Fluent/Attributes | Partial methods | **:white_check_mark: Attributes** |
| **Bidirectional Mapping** | :white_check_mark: Yes | :white_check_mark: Yes | :warning: Manual | **:white_check_mark: Automatic BackTo()** |
| **Nested Objects** | :warning: Manual config | :white_check_mark: Auto | :warning: Manual config | **:white_check_mark: Auto NestedFacets** |
| **Flattening** | :white_check_mark: Yes | :white_check_mark: Yes | :warning: Limited | **:white_check_mark: Advanced [Flatten]** |
| **FK Clash Detection** | :x: No | :x: No | :x: No | **:white_check_mark: Yes** |
| **EF Projections** | :white_check_mark: ProjectTo | :white_check_mark: Yes | :warning: Manual | **:white_check_mark: Auto Projection** |
| **Custom Logic** | :white_check_mark: Resolvers | :white_check_mark: AdaptWith | :warning: Partial methods | **:white_check_mark: IFacetMapConfiguration** |
| **Compile-time Safety** | :x: Runtime | :warning: Hybrid | :white_check_mark: Full | **:white_check_mark: Full** |
| **Generated Code Visibility** | :x: No | :warning: Optional | :white_check_mark: Full | **:white_check_mark: Full** |
| **Learning Curve** | Medium | Easy | Medium-Hard | **Easy** |
| **License** | :moneybag: Commercial | :white_check_mark: MIT | :white_check_mark: Apache 2.0 | **:white_check_mark: MIT** |

### Configuration Approaches

| Library | Configuration Style | Reverse Mapping | Nested Objects | Learning Curve |
|---------|-------------------|-----------------|----------------|----------------|
| **AutoMapper** | Profiles + Fluent API | Explicit setup required | Manual configuration | Medium |
| **Mapster** | Fluent/Attributes | Automatic | Mostly automatic | Easy |
| **Mapperly** | Partial methods | Manual method per direction | Manual configuration | Medium-Hard |
| **Facet** | Attributes on DTOs | Automatic `BackTo()` | Automatic `NestedFacet` | Easy |

### Flattening Capabilities

| Scenario | AutoMapper | Mapster | Mapperly | Facet |
|----------|-----------|---------|----------|-------|
| **Basic Flattening** | Manual per property | Automatic conventions | Limited support | Automatic with `[Flatten]` |
| **FK Collision Handling** | Numeric suffix (CustomerId2) | Numeric suffix (CustomerId2) | Manual handling | Smart detection with `IgnoreForeignKeyClashes` |
| **Nested FK Detection** | No | No | No | Yes (recursive) |
| **Configuration Needed** | High | Low | Medium | Minimal |

### EF Core Integration

| Library | Approach | Syntax Complexity | Generated Code |
|---------|----------|-------------------|----------------|
| **AutoMapper** | `ProjectTo<>()` with config provider | Medium | Hidden |
| **Mapster** | `ProjectToType<>()` | Low | Hidden |
| **Mapperly** | Manual `Expression<Func<>>` | High | Visible |
| **Facet** | `SelectFacet<>()` or `Projection` property | Low | Visible |

## Detailed Pros and Cons

### AutoMapper

**Strengths:** AutoMapper is mature and battle-tested with 14+ years of production use. It has a huge ecosystem and community, extensive documentation, and works with legacy .NET Framework projects. The convention-based approach means less code for simple cases.

**Weaknesses:** Commercial license is required starting with v15.0+. Performance is the slowest among these options due to reflection-based implementation, with the highest memory usage. Runtime errors can occur since there's no compile-time safety. Configuration can become complex, there's no generated code visibility, and mapping issues can be difficult to debug.

**Considerations:** Mature option with extensive ecosystem. Licensing model is a key decision factor. Performance characteristics differ from source generation alternatives.

### Mapster

**Strengths:** Fast performance (4x faster than AutoMapper) with a low memory footprint (1/3 of AutoMapper). Minimal configuration needed, MIT licensed (free), automatic flattening, and a good balance of features and simplicity.

**Weaknesses:** Development appears stalled with an uncertain future. No compile-time safety for all operations, limited nested object configuration, no FK clash detection, community concerns about maintenance, and less transparent than pure source generators.

**Considerations:** Offers good performance with minimal configuration. Project activity worth monitoring for long-term planning.

### Mapperly

**Strengths:** Fastest performance (tied with Facet) with zero runtime overhead. Full compile-time safety, transparent generated code, very active development, and Apache 2.0 licensed. Chosen by major frameworks like ABP, with a growing community.

**Weaknesses:** Requires manual method per mapping with a steeper learning curve. Limited nested object support, basic flattening (not automatic), no FK clash detection, no automatic bidirectional mapping, and more boilerplate code needed.

**Considerations:** Strong choice for teams preferring explicit control. Active development and growing adoption. More verbose than convention-based alternatives but offers transparency.

### Facet

**Strengths:** Fastest performance through pure source generation with zero runtime overhead. Full compile-time safety and transparent generated code. Attribute-based API is simple and intuitive. Automatic bidirectional mapping with BackTo methods, automatic nested object handling with NestedFacets, advanced flattening with the [Flatten] attribute, unique FK clash detection feature, auto-generated EF projections, and custom mapping logic support via IFacetMapConfiguration. MIT licensed with active development and minimal boilerplate.

**Weaknesses:** Smaller community as a newer library. Less Stack Overflow content available, fewer third-party resources and tutorials, and a different mental model from traditional mappers since it generates DTOs rather than just mapping between them.

**Tradeoffs:** Newer library with less ecosystem maturity, but offers modern source generation approach with comprehensive built-in features.

## Migration Considerations

### Migration Effort Assessment

| From | To | Effort Level | Key Changes |
|------|----|--------------| ------------|
| **AutoMapper** | Facet | Low-Medium | Replace profiles with attributes; custom logic moves to `IFacetMapConfiguration` |
| **AutoMapper** | Mapperly | Medium | Create mapper classes; define explicit methods for each direction |
| **Mapster** | Facet | Very Low | Replace `.Adapt<>()` with constructors and `.BackTo()` |
| **Mapster** | Mapperly | Medium | Add mapper classes; replace convention with explicit methods |
| **Mapperly** | Facet | Low | Remove mapper classes; replace with attributes on DTOs |

### Migration Considerations by Library

**From AutoMapper:** Most simple mappings convert 1:1, which makes the process straightforward. However, custom resolvers need restructuring, profile organization changes to attribute-based or class-based approaches, and dependency injection patterns may need adjustment.

**From Mapster:** Very similar usage patterns (especially with Facet) and the convention-based approach aligns well, making migration relatively smooth. Custom adaptations will need restructuring to fit the new library's patterns.

**From Mapperly:** Already using source generation means the code is already compile-time safe, which reduces migration risk. More concise syntax is possible (especially with Facet), though there's a different organization model to adapt to (classes vs. attributes).

## Performance Benchmarks

Based on community benchmarks and analysis from 2025:

### Simple Object Mapping (1000 iterations)

| Library | Time (ms) | Memory (KB) | Relative Speed |
|---------|-----------|-------------|----------------|
| **Facet** | 0.15 | 12 | 1.00x (baseline) |
| **Mapperly** | 0.15 | 12 | 1.00x |
| **Mapster** | 0.42 | 35 | 2.80x slower |
| **AutoMapper** | 1.85 | 156 | 12.33x slower |

### Complex Object with Nesting (1000 iterations)

| Library | Time (ms) | Memory (KB) | Relative Speed |
|---------|-----------|-------------|----------------|
| **Facet** | 0.28 | 18 | 1.00x (baseline) |
| **Mapperly** | 0.28 | 18 | 1.00x |
| **Mapster** | 0.89 | 48 | 3.18x slower |
| **AutoMapper** | 4.12 | 287 | 14.71x slower |

**Key Observations:** Source generation approaches (Facet, Mapperly) show similar performance profiles. Hybrid approaches (Mapster) fall in the middle. Reflection-based approaches (AutoMapper) have different performance characteristics, with tradeoffs in flexibility vs speed.

## Choosing the Right Library for Your Needs

The "best" mapping library depends on your specific requirements and constraints:

**AutoMapper makes sense** when you have an existing commercial license or budget for one, need .NET Framework support, have a large legacy codebase where migration cost is significant, or your team is deeply familiar with AutoMapper patterns.

**Mapster is a good fit** if you have existing Mapster code that's working well, want good performance with minimal configuration, prefer runtime flexibility over compile-time generation, or you're comfortable monitoring project activity.

**Mapperly works well** when you prefer explicit over implicit/convention-based approaches, want maximum transparency in generated code, your team values verbosity and clarity, you're willing to write more boilerplate for type safety, or you need a well-supported, actively developed source generator.

**Facet is ideal** when you want the library to generate your DTOs (not just map between them), prefer defining your models once and generating variations, want attribute-based configuration, have bidirectional mapping as a common requirement, frequently work with nested object structures, need advanced flattening capabilities (especially with EF models), prefer convention over configuration where sensible, or you're starting a new project or can migrate existing code.

**Important Note:** Facet's approach is fundamentally different - it generates your DTOs for you. If you prefer manually writing all your DTOs and just need mapping logic, Mapperly or the others may be more aligned with your workflow.


## Trends in Object Mapping

Looking at the evolution in late 2025, several observable shifts are happening: Source generation is gaining traction with more libraries moving toward compile-time code generation. Licensing considerations from AutoMapper's commercial transition are influencing library choices. There's a growing emphasis on developer experience and reducing boilerplate. Compile-time safety is increasingly preferred for catching errors at build time.

The industry direction shows continued movement toward source generator adoption and compile-time generation. Better IDE integration is providing improved tooling support for generated code inspection. There's active debate between attribute-based, fluent, and method-based configuration approaches. The ongoing tradeoff between convention and explicitness (magic vs. clarity) remains a key discussion point. EF Core integration, particularly query projection support, is becoming table stakes for modern mapping libraries.

## Decision Framework

Here are factors to consider based on your situation:

**For New Projects:** Start by evaluating your priorities around performance, developer experience, and explicitness vs. convention. Source generators (Facet, Mapperly) offer the best performance and compile-time safety. A hybrid approach (Mapster) provides balance of performance and flexibility. Traditional options (AutoMapper) offer a mature ecosystem but come with licensing considerations.

**For Existing AutoMapper Projects:** Review licensing to assess RPL-1.5 compatibility or budget for a commercial license. Consider migration options including Mapperly (explicit approach), Facet (convention-based), or Mapster (hybrid). Migration complexity varies by codebase size and mapping complexity.

**For Existing Mapster Projects:** If working well, consider staying with the current solution. For long-term planning, monitor project activity and have contingency plans. Facet or Mapperly are viable alternatives if migration becomes necessary.

**For Existing Mapperly Projects:** If the explicit approach works for your team, consider staying. Evaluate if you need features from other libraries through a feature comparison. Consider the effort vs. benefit tradeoff of switching.

## Getting Started

### Installation

All libraries are available via NuGet:

- **AutoMapper:** `dotnet add package AutoMapper` (commercial license required)
- **Mapster:** `dotnet add package Mapster`
- **Mapperly:** `dotnet add package Mapperly`
- **Facet:** `dotnet add package Facet`

### Learning Resources

AutoMapper has extensive documentation, 14+ years of Stack Overflow answers, and commercial support available. Mapster provides GitHub documentation and community examples. Mapperly maintains an active GitHub repository with growing documentation. Facet offers GitHub documentation with examples and a growing community.

## Conclusion

The .NET mapping library landscape evolved significantly in 2025. AutoMapper's licensing change prompted many teams to reevaluate their options, leading to increased interest in alternative approaches.

AutoMapper remains a mature, feature-rich mapper with commercial licensing considerations. Mapster offers good performance with minimal configuration, worth monitoring for activity. Mapperly provides explicit, transparent source generation for mapping. Facet is fundamentally different as a DTO generator with integrated mapping capabilities.

Each library makes different tradeoffs around generation vs. mapping (Facet generates DTOs; others map between existing ones), explicitness vs. convention (Mapperly vs. Facet/Mapster), runtime vs. compile-time (AutoMapper vs. source generators), verbosity vs. magic (spectrum across all libraries), and maturity vs. modern features (AutoMapper vs. newer alternatives).

Your choice should depend on whether you want generated DTOs or manual DTOs (Facet generates; others map), team preferences (explicit vs. implicit), performance requirements, licensing constraints, feature needs (bidirectional, flattening, etc.), existing codebase considerations, and long-term maintenance concerns.

There's no universal "best" choice - evaluate based on your specific context and constraints. The most fundamental question is whether you want a tool that generates your DTOs (Facet) or a tool that maps between DTOs you've already written (all the others).

## Resources

- **Facet GitHub:** [https://github.com/facet-tools/Facet](https://github.com/facet-tools/Facet)
- **Facet Documentation:** [Full docs with examples](https://github.com/facet-tools/Facet/tree/master/docs)
- **NuGet Package:** `dotnet add package Facet`
- **Comparison Benchmarks:** [Community benchmarks](https://github.com/mjebrahimi/Benchmark.netCoreMappers)

---

**What's your experience with these mapping libraries? Which features matter most to your team? Share your thoughts in the comments.**

*Disclosure: This analysis includes Facet, which I contribute to, alongside an objective comparison of all major alternatives based on 2025 community data and documentation.*
