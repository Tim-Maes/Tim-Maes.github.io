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
| **Facet** | ??? Fastest (source gen) | Minimal | Compile-time generation |
| **Mapperly** | ??? Fastest (source gen) | Minimal | Compile-time generation |
| **Mapster** | ?? Fast | ~1/3 of AutoMapper | Hybrid (compile + runtime) |
| **AutoMapper** | ? Slowest | Highest | Runtime reflection |

**Analysis:** Source generation-based libraries (Facet, Mapperly) show similar performance characteristics, both offering minimal runtime overhead compared to reflection-based approaches.

### Feature Comparison

| Feature | AutoMapper | Mapster | Mapperly | **Facet** |
|---------|-----------|---------|----------|-----------|
| **Configuration Style** | Profiles + Fluent | Fluent/Attributes | Partial methods | **? Attributes** |
| **Bidirectional Mapping** | ? Yes | ? Yes | ? Manual | **? Automatic BackTo()** |
| **Nested Objects** | ? Manual config | ? Auto | ? Manual config | **? Auto NestedFacets** |
| **Flattening** | ? Yes | ? Yes | ? Limited | **? Advanced [Flatten]** |
| **FK Clash Detection** | ? No | ? No | ? No | **? Yes** |
| **EF Projections** | ? ProjectTo | ? Yes | ? Manual | **? Auto Projection** |
| **Custom Logic** | ? Resolvers | ? AdaptWith | ? Partial methods | **? IFacetMapConfiguration** |
| **Compile-time Safety** | ? Runtime | ? Hybrid | ? Full | **? Full** |
| **Generated Code Visibility** | ? No | ? Optional | ? Full | **? Full** |
| **Learning Curve** | Medium | Easy | Medium-Hard | **Easy** |
| **License** | $ Commercial | ? MIT | ? Apache 2.0 | **? MIT** |

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

**Strengths:**
- Mature and battle-tested with 14+ years of production use
- Huge ecosystem and community
- Extensive documentation
- Works with legacy .NET Framework projects
- Convention-based approach reduces code for simple cases

**Weaknesses:**
- Commercial license required starting with v15.0+
- Slowest performance (reflection-based) and highest memory usage
- No compile-time safety; runtime mapping errors possible
- Configuration can become complex for advanced scenarios
- No generated code visibility; harder debugging of mapping issues

**Considerations:**
- Licensing model is a key decision factor
- Performance characteristics differ from source generation alternatives

### Mapster

**Strengths:**
- Faster than AutoMapper (claimed ~4x) with low memory footprint (~1/3 AutoMapper)
- Minimal configuration required
- MIT licensed (free)
- Automatic flattening support
- Good balance of features and simplicity

**Weaknesses:**
- Development cadence has slowed; uncertain future
- Not fully compile-time safe for all operations
- Limited nested object configuration
- No FK clash detection feature
- Less transparent than pure source generators

**Considerations:**
- Good performance with low effort
- Project activity should be monitored for long-term adoption

### Mapperly

**Strengths:**
- Fastest performance (tied with Facet) and zero runtime overhead
- Full compile-time safety
- Transparent generated code (inspectable)
- Very active development and growing community
- Apache 2.0 license
- Adopted by major frameworks (e.g., ABP)

**Weaknesses:**
- Requires explicit method per mapping direction (more boilerplate)
- Steeper learning curve for explicit style
- Limited nested object support; needs manual config
- Basic/limited flattening; not automatic
- No FK clash detection
- No automatic bidirectional mapping

**Considerations:**
- Strong fit for teams preferring explicit control & transparency
- Verbosity trades off against clarity and safety benefits

### Facet

**Strengths:**
- Fastest performance (tied with Mapperly) via pure source generation
- Full compile-time safety
- Transparent generated code
- Simple, intuitive attribute-based API
- Automatic bidirectional mapping with `BackTo()`
- Automatic nested object handling via `NestedFacets`
- Advanced flattening with `[Flatten]`
- Unique FK clash detection (including nested/recursive cases)
- Auto-generated EF projections
- Custom mapping extensibility via `IFacetMapConfiguration`
- MIT licensed and active development
- Minimal boilerplate (DTOs generated for you)

**Weaknesses:**
- Newer library with smaller community
- Fewer third-party resources / tutorials / Q&A content
- Different mental model (DTO generation vs manual DTO definition)

**Tradeoffs:**
- Less ecosystem maturity vs broader feature integration and reduced manual DTO maintenance

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

The .NET mapping library landscape has evolved significantly in 2025, driven primarily by AutoMapper's transition to a commercial licensing model. This shift has accelerated the adoption of modern source generator-based alternatives.

**The Four Approaches:**

- **AutoMapper** remains a mature option with extensive ecosystem support, but now requires licensing consideration
- **Mapster** offers a middle-ground with good performance and minimal configuration, though future development trajectory should be monitored
- **Mapperly** provides explicit, transparent compile-time generation for teams that value clarity and type safety
- **Facet** takes a unique approach by generating your DTOs entirely, not just the mapping logic between them

**Key Decision Factors:**

Your choice ultimately depends on several factors:

1. **Philosophy**: Do you want to write your DTOs manually (AutoMapper/Mapster/Mapperly) or have them generated from source models (Facet)?
2. **Performance**: Source generators (Facet, Mapperly) offer the best runtime performance
3. **Developer Experience**: Consider your team's preference for explicit vs. convention-based approaches
4. **Licensing**: Budget and license compatibility requirements
5. **Features**: Bidirectional mapping, flattening, and EF projection needs
6. **Maintenance**: Long-term support and community size

There's no universal "best" choice. Evaluate based on your project's specific requirements, team preferences, and long-term maintenance considerations. The most fundamental decision is whether you want a DTO generator with mapping capabilities or a pure mapping library.

## Resources

- **Facet GitHub:** [https://github.com/facet-tools/Facet](https://github.com/facet-tools/Facet)
- **Facet Documentation:** [Full docs with examples](https://github.com/facet-tools/Facet/tree/master/docs)
- **NuGet Package:** `dotnet add package Facet`
- **Comparison Benchmarks:** [Community benchmarks](https://github.com/mjebrahimi/Benchmark.netCoreMappers)

---

**What's your experience with these mapping libraries? Which features matter most to your team? Share your thoughts in the comments.**

*Disclosure: This analysis includes Facet, which I contribute to, alongside an objective comparison of all major alternatives based on 2025 community data and documentation.*
