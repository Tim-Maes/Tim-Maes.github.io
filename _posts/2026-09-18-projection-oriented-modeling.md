---
layout: post
title: "Projection-Oriented Modeling: Stop Mapping, Start Projecting"
date: 2026-09-18 10:00:00 +0000
tags: [dotnet, csharp, architecture, design-patterns, source-generators, ef-core, facet]
excerpt: "Object mapping treats different representations as separate models that need translation. Projection-Oriented Modeling treats consumer-specific models as views of an existing source model - and that shift changes how you design your application."
---

Most .NET applications end up with the same shape: a domain model, a pile of DTOs, and a layer of mapping code holding them together. We've all written it. We've all debated AutoMapper versus manual mapping versus Mapperly.

But I want to question something more fundamental than *how* we map. I want to question whether "mapping" is the right mental model at all.

Here is the thesis:

> Object mapping treats different representations as separate models that need to be translated between. **Projection-Oriented Modeling** instead treats consumer-specific models as projections, or views, of an existing source model.

<!--more-->

Visually, the difference looks like this.

Traditional mapping:

```text
Source Model
     ↓
   Mapper
     ↓
Destination Model
```

Projection-Oriented Modeling:

```text
             Source Model
                  │
       ┌──────────┼──────────┐
       ↓          ↓          ↓
   Projection  Projection  Projection
       ↓          ↓          ↓
    API Model  List Model  Detail Model
```

This is not just a new name for DTOs. The shift is that the destination model **explicitly represents a view of the source**, rather than being an independently maintained model connected through mapping code.

Let me show what that means in practice.

## Start with the problem

Here's a domain model you've seen a hundred times:

```csharp
public class Customer
{
    public int Id { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string Email { get; set; } = "";
    public Address Address { get; set; } = null!;
    public ICollection<Order> Orders { get; set; } = [];
}
```

Now several consumers show up, each needing a different shape:

```csharp
public class CustomerListItem
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}

public class CustomerDetails
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string City { get; set; } = "";
}
```

And conventional development produces the inevitable:

```csharp
var result = new CustomerListItem
{
    Id = customer.Id,
    Name = $"{customer.FirstName} {customer.LastName}"
};
```

Multiply that by every consumer:

```text
Customer
   ↓
CustomerListItem mapping

Customer
   ↓
CustomerDetails mapping

Customer
   ↓
CustomerSearchResult mapping

Customer
   ↓
CustomerApiResponse mapping
```

### What actually goes wrong

The problems are not dramatic. They're the slow kind:

- **Mapping code grows linearly with the number of representations.** Four consumers, four mappings, and each one is a place to make a mistake.
- **Mappings drift apart.** `CustomerListItem` formats the name as `"{First} {Last}"`. `CustomerSearchResult` formats it as `"{Last}, {First}"`. Nobody decided this; it just happened.
- **Mappings get forgotten.** You add `MiddleName` to `Customer`. Which of the four mappings should change? The compiler has no opinion.
- **Mapping happens after loading more data than needed.** `SELECT *`, materialize the full entity graph, then throw most of it away in memory.
- **Query shape and consumer shape become separate concerns.** The database doesn't know what the consumer actually wants, because that knowledge lives in a mapper class somewhere else.
- **Relationships that could be known at compile time are hidden at runtime.** A reflection-based mapper cannot tell you, during a build, that a projection is now invalid.

To be clear: **traditional mapping is not bad.** It is exactly the right tool when two models genuinely represent different concepts, or when the transformation carries real semantic weight. I'll come back to that distinction, because it matters a lot.

The problem is that we reach for mapping even when the relationship is not a transformation at all. It's a *view*.

## Introducing Projection-Oriented Modeling

The core move is a change of question.

> Instead of asking "How do I map this object to another object?", ask "**What projection of this model does this consumer need?**"

Under this framing, the destination type stops being an independent class that happens to receive values. It becomes a **declaration of a desired shape**:

```text
Customer
   │
   ├── CustomerListItem
   │
   ├── CustomerDetails
   │
   └── CustomerSearchResult
```

These are not three unrelated models. They are three projections of `Customer`. The relationship is not incidental - it's the defining property of each type.

Once you accept that, something useful follows: if the relationship is explicit, the transformation can often be *derived* rather than written.

### Projections exist at every layer

A projection isn't only an in-memory concept. It can be pushed down:

```text
Database
   ↓
Queryable Projection
   ↓
Application Model
   ↓
API/UI Consumer
```

This is where LINQ and EF Core become interesting, because a projection expressed as an expression tree can be translated into SQL.

Compare the two versions. First, the map-after-load approach:

```csharp
var customers = await db.Customers
    .ToListAsync();

var result = customers
    .Select(x => new CustomerListItem
    {
        Id = x.Id,
        Name = $"{x.FirstName} {x.LastName}"
    })
    .ToList();
```

And the projection-oriented version:

```csharp
var result = await db.Customers
    .Select(CustomerListItem.Projection)
    .ToListAsync();
```

Conceptually:

```text
Traditional:

Database
   ↓
Full Customer
   ↓
Mapping
   ↓
CustomerListItem


Projection-oriented:

Database
   ↓
SELECT only what is required
   ↓
CustomerListItem
```

The second form isn't just faster. It's *more honest*. The shape the consumer needs is the shape the query asks for.

That said, do not read this as "every projection must hit a database." Projections work perfectly well over in-memory collections, cached aggregates, or results from an external service. The database case is simply the one where the payoff is most visible.

## How this relates to things you already know

I want to be intellectually honest here, because it would be easy to oversell this.

**Projection is not a new concept.** It predates all of us. Relational algebra has had projection since Codd. SQL views are projections. LINQ's `Select` is a projection operator. EF Core has supported query projections for years. CQRS read models are, in a very real sense, projections. DDD has long distinguished between aggregates and read models. AutoMapper's `ProjectTo<T>()` has existed for over a decade, and Mapster and Mapperly both support projection expressions.

So what, if anything, is different?

Not the mechanism. **The modeling philosophy.**

> Treating projections as first-class models, and making the relationship between source and projection explicit in the type system, rather than treating mapping as a separate infrastructure concern.

In a typical mapping-based codebase, the relationship between `Customer` and `CustomerListItem` lives in a `Profile` class, a `[Mapper]` partial, or a hand-written extension method. It's *configuration*. It sits beside the model, not in it.

In a projection-oriented codebase, `CustomerListItem` **declares** that it is a view of `Customer`. The relationship is part of the type definition. Everything else - the constructor, the mapping, the queryable expression - is a consequence of that declaration rather than a separate artifact you maintain.

That's a smaller claim than "we invented projections," and it's the accurate one. POM is an attempt to unify several existing practices under a single modeling principle.

## Facet: one implementation of the idea

Now let's get concrete. [Facet](https://github.com/Tim-Maes/Facet) is a C# source generator that generates models from existing source models. It's a reasonable way to express POM in .NET, because a source generator can see the relationship at compile time and materialize everything that follows from it.

The layering:

```text
Projection-Oriented Modeling
            │
            │ design principle
            ▼
         Facet
            │
            │ implementation
            ▼
Generated projections/models
```

To be explicit about it:

> **POM is the architectural idea. Facet is one implementation of that idea for the .NET ecosystem.**

You could implement POM with hand-written static `Expression<Func<TSource, TDest>>` properties and no library at all. Facet just removes the boilerplate.

### Define less, project more

Facet's philosophy is that you shouldn't be maintaining five artifacts for one concept. In a conventional setup you write:

```text
Entity
DTO
DTO mapper
Projection expression
Reverse mapper
```

With an explicit source-to-projection relationship, most of those can be derived. Here's the basic form:

```csharp
[Facet(typeof(Customer), Include = ["Id", "FirstName", "LastName"])]
public partial record CustomerListItem;
```

That single declaration yields:

```text
Customer
   │
   └── CustomerListItem
          ├── model
          ├── construction
          ├── mapping
          └── query projection
```

Concretely, you get the properties, a constructor that takes the source, extension methods, and a static `Projection` expression usable by any LINQ provider:

```csharp
Customer customer = GetCustomer();

// Constructor
var item = new CustomerListItem(customer);

// Extension method
var item2 = customer.ToFacet<Customer, CustomerListItem>();

// Queryable projection
var items = await db.Customers
    .Where(c => c.IsActive)
    .SelectFacet<CustomerListItem>()
    .ToListAsync();
```

Exclusion works too, which is often the better default when the projection is "everything except the sensitive bits":

```csharp
[Facet(typeof(Customer), "PasswordHash", "InternalNotes")]
public partial record CustomerPublic;
```

You can rename while projecting:

```csharp
[Facet(typeof(Customer), Include = ["Id", "FirstName"])]
public partial record CustomerDto
{
    [MapFrom(nameof(Customer.FirstName))]
    public string Name { get; set; } = string.Empty;
}
```

And project back to the source when the facet represents an editable view:

```csharp
[Facet(typeof(Customer),
    Include = ["FirstName", "LastName", "Email"],
    GenerateToSource = true)]
public partial record CustomerUpdateRequest;

var customer = request.ToSource();
```

## Why source generation fits this pattern

POM pairs naturally with compile-time generation, and it's worth being precise about why.

A runtime mapper works like this:

```text
Runtime mapper

Application
    ↓
Mapper configuration
    ↓
Runtime reflection/execution
```

A source generator works like this:

```text
Source generation

Source model
    ↓
Compiler
    ↓
Generated projection/mapping code
    ↓
Normal C#
```

The practical consequences:

- **Compile-time feedback.** Rename a property on `Customer` and the build tells you which projections broke. No startup-time configuration validation, no integration test that happens to catch it.
- **Generated code is inspectable.** You can read exactly what runs. There's no "why did it map that field?" mystery.
- **No runtime configuration.** Nothing to register, nothing to validate at startup.
- **Strong typing end to end.** The projection is a real type with real members.
- **Refactoring works.** Your IDE understands generated code the same way it understands hand-written code.
- **Projection expressions are LINQ-provider-consumable.** This is the big one for EF Core - an expression tree can become SQL, while a compiled delegate cannot.

On performance: generated code avoids reflection and avoids over-fetching, which generally helps. I'd rather not make absolute claims - measure your own workload. The structural benefits above are the more reliable argument.

## EF Core: where it pays off most

The everyday case:

```csharp
var customers = await db.Customers
    .Select(CustomerListItem.Projection)
    .ToListAsync();
```

Or with the extension:

```csharp
var customers = await db.Customers
    .Where(c => c.IsActive)
    .SelectFacet<CustomerListItem>()
    .ToListAsync();
```

The application never needs:

```text
SELECT *
```

followed by an in-memory transformation. The projection **becomes part of the query**.

### Nested projections and flattening

Real models aren't flat. Consider:

```text
Customer
 ├── Id
 ├── Name
 └── Address
       └── City
```

The consumer wants:

```text
CustomerSummary
 ├── Id
 ├── Name
 └── City
```

Facet supports nested facets, where a related type is itself projected:

```csharp
[Facet(typeof(Address), Include = ["City", "Country"])]
public partial record AddressDto;

[Facet(typeof(Customer),
    Include = ["Id", "FirstName", "LastName", "Address"],
    NestedFacets = [typeof(AddressDto)])]
public partial record CustomerSummary;
```

The nested projection composes into the query, so you get proper JOINs selecting only the needed columns - no `.Include()` pulling the entire related graph into memory first.

Flattening is the alternative when the consumer wants a genuinely flat shape rather than a nested one. Both are legitimate; the choice depends on what the consumer is. A UI list usually wants flat. An API response often wants nested, because the nesting carries meaning.

## Projection is not transformation

This is the most important section in the article, because without it POM becomes a bad idea applied universally.

**Not every mapping is a projection.**

```text
CustomerEntity → CustomerListItem
```

That's a projection. Same concept, narrower view.

```text
LegacyCustomer → NewCustomer
```

That's a transformation. Two models that represent the same *domain* concept but with different structures, invariants, and history. There's real logic there - defaults, normalization, handling of fields that no longer exist.

```text
CreateCustomerRequest → CreateCustomerCommand
```

That's a translation. It crosses a semantic boundary between the HTTP layer and the application layer. The types may look nearly identical, but they exist for different reasons and should be free to evolve independently.

A useful three-way split:

```text
Projection
    "Give me a different view of this model."

Transformation
    "Convert this model into another representation."

Translation
    "Cross a semantic/application boundary."
```

**POM is concerned with the first category only.**

This matters because it means POM is not a claim that mapping should disappear. It's a claim that a large fraction of what we currently call "mapping" was never a transformation - it was a view we didn't have the vocabulary to express.

## Where POM works well

**API responses.** The response is a public view of an internal model.

```text
Customer
    ↓
CustomerResponse
```

**List and search models.** Grids and search results need a small, fixed subset. Loading full aggregates to render a table is pure waste.

```text
Customer
    ↓
CustomerSearchResult
```

**Detail pages.** A wider view than the list, still narrower than the aggregate.

```text
Customer
    ↓
CustomerDetails
```

**EF Core queries.** The clearest win, because the projection changes the SQL rather than being applied afterward.

```text
IQueryable<Customer>
    ↓
IQueryable<CustomerListItem>
```

**UI models.** A component typically needs a precisely-defined slice. Making that slice a named projection documents the component's data requirements in the type system.

**Reporting and read-side scenarios.** Read models are projections by nature. POM just names what CQRS practitioners have been doing informally.

## Where NOT to use it

Be honest about the boundaries:

- **Migrations between genuinely different models.** Legacy-to-modern conversion is transformation work with real rules.
- **External system integrations.** A third-party contract is not a view of your model; it's someone else's model. Coupling them is how you end up redeploying because a vendor renamed a field.
- **Semantic transformations.** If the conversion encodes business rules, it's logic and deserves to be explicit and tested.
- **Legacy-to-modern conversions.** Same reasoning.
- **Models with intentionally different invariants.** If the destination enforces rules the source doesn't, it isn't a view.
- **Types that merely look similar.** This is the trap.

The guiding principle:

> **Similar shape does not necessarily mean same model.**

If `OrderDto` and `InvoiceLine` happen to have the same five properties today, that's coincidence, not relationship. Linking them as a projection couples two concepts that should be free to diverge.

## Comparing the approaches

The useful comparison isn't which is "better" - it's which question each one answers.

| Approach                     | Primary question                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------- |
| Manual mapping               | How do I convert A into B?                                                       |
| AutoMapper/Mapster           | How can mapping A → B be automated?                                              |
| EF projection                | How do I query only the fields I need?                                           |
| DTO modeling                 | What shape should cross this boundary?                                           |
| Projection-Oriented Modeling | What view of the source model does this consumer need?                           |
| Facet                        | How can that projection relationship be expressed and generated at compile time? |

None of these is universally superior. Most real systems need several of them at once - and that's fine, as long as you're deliberate about which question you're actually answering.

## Architectural consequences

This is where it gets genuinely interesting, because making projections first-class changes the shape of the codebase.

Instead of a flat pile of DTOs and mapper classes with no visible relationships, you get a structure:

```text
                    Customer
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Summary       Details      Search
          │            │            │
          ▼            ▼            ▼
         API           UI          Query
```

A few things follow from this.

**Data requirements become visible.** You can look at a model and see every view of it that exists in the system. "What does the search endpoint actually need from `Customer`?" has an answer you can navigate to.

**Impact analysis gets cheaper.** Change the source and the compiler enumerates the affected projections. Compare that to grepping for mapper configurations.

**Naming improves.** `CustomerMapper.MapToListDto()` tells you about mechanism. `CustomerListItem` tells you about purpose.

**Over-fetching becomes visible.** When the projection is the query, a projection that pulls twenty columns for a two-column UI is obvious in code review.

### The trade-off

I'd be doing you a disservice if I stopped there.

**Projections multiply.** Give a team a cheap way to define views and you will get a lot of views. Fifteen facets of `Customer`, several nearly identical, is a real outcome. The model surface grows, and "which projection should I use here?" becomes a genuine question.

**Coupling to the source becomes structural.** A projection is *defined by* its source. Change the source and every projection is affected by design. That's mostly what you want - it's the compile-time safety - but it does mean the source model can't evolve in isolation. If you deliberately want a decoupled boundary, an independent DTO with explicit mapping is the correct choice.

**Generated abstractions need tooling.** Source generators require IDE support, and debugging through generated code is a different experience than stepping through code you wrote.

**Complex cases still need real mapping.** Conditional logic, aggregation across sources, and semantic conversion don't fit the projection model, and forcing them in produces something worse than a plain mapper.

These are trade-offs, not objections. But you should make them knowingly.

## The pattern, formally

### Projection-Oriented Modeling

**Intent**

Model consumer-specific representations as explicit projections of an existing model, rather than treating them primarily as independently maintained models connected by mapping code.

**Problem**

Applications frequently require many representations of the same underlying data. Traditional mapping introduces repetitive transformation code and can separate query shape from consumer shape, resulting in over-fetching, inconsistency, and relationships that are invisible at compile time.

**Solution**

Define consumer-specific models as projections of a source model, and derive the required transformation and query projection from that relationship wherever practical.

**Benefits**

- Explicit relationships between models
- Compile-time discoverability
- Reusable projections
- Efficient query composition
- Less repetitive mapping code
- Clearer consumer-specific data requirements

**Trade-offs**

- Projection definitions can multiply
- Not every model relationship is a projection
- Complex transformations may still require explicit mapping
- Source and projection lifecycles become coupled
- Generated abstractions require tooling

## The broader question

I don't think the interesting outcome here is "use this library instead of that library." Mappers are fine. I've shipped plenty of code with AutoMapper and I'd do it again where the relationship is genuinely a transformation.

The interesting question is about vocabulary.

We've spent years describing every model relationship as "mapping," which pushed us toward treating every destination type as an independent model requiring translation. That framing has costs: it hides relationships, separates query shape from consumer shape, and turns compile-time knowledge into runtime configuration.

So:

> **What if we stopped thinking of DTOs as things we map *to*, and started thinking of them as views we *project*?**

Some of your DTOs really are separate models, and they should stay that way. But I suspect a lot of them - the list items, the summaries, the search results, the API responses - were never separate models at all. They were views, and we just didn't have a way to say so.

Facet is one practical attempt to make that idea explicit in C#. It's not the only possible implementation, and the pattern matters more than the tool.

The next time you reach for a mapper, it's worth pausing on one question: *am I transforming this model, or am I just looking at part of it?*

---

**Resources:**
- [Facet on GitHub](https://github.com/Tim-Maes/Facet)
- [Facet Documentation](https://github.com/Tim-Maes/Facet/wiki)
- [Facet on NuGet](https://www.nuget.org/packages/Facet)
- [Discord Community](https://discord.gg/yGDBhGuNMB)


