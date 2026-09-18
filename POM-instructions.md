Write a technical blog post introducing and explaining a software development pattern called **Projection-Oriented Modeling (POM)**.

The article should be written for experienced software developers, architects, and especially .NET developers. It should be technically credible, practical, and thought-provoking rather than marketing-heavy.

## Core idea

The central thesis of the article is:

> Object mapping treats different representations as separate models that need to be translated between. Projection-Oriented Modeling instead treats consumer-specific models as projections or views of an existing source model.

Explain the difference between these two mental models:

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

The article should make clear that this is not simply a new name for DTOs or object mapping. The important shift is that the destination model explicitly represents a **view/facet/projection of the source**, rather than being an independently maintained model connected through mapping code.

## Start with the problem

Begin with a familiar example.

Show a domain/entity model such as:

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

Then show several consumers needing different shapes:

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

Explain how conventional development tends to result in mapping code such as:

```csharp
var result = new CustomerListItem
{
    Id = customer.Id,
    Name = $"{customer.FirstName} {customer.LastName}"
};
```

and eventually:

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

Discuss the maintenance problem:

* mapping code grows with the number of representations
* mappings can become inconsistent
* mappings can be forgotten when models evolve
* mapping is often performed after loading more data than is actually required
* database queries and object mapping can become separate concerns
* runtime mapping hides relationships that could otherwise be known at compile time

Do not claim that traditional mapping is inherently bad. Explain that it is useful when two models genuinely represent different concepts or require semantic transformation.

## Introduce Projection-Oriented Modeling

Introduce the pattern as a different way of thinking:

> Instead of asking "How do I map this object to another object?", ask "What projection of this model does this consumer need?"

Explain that the destination type becomes a declaration of the desired shape.

For example:

```text
Customer
   │
   ├── CustomerListItem
   │
   ├── CustomerDetails
   │
   └── CustomerSearchResult
```

These are not necessarily independent models. They can be understood as **projections of Customer**.

Explain that the projection can exist at different levels:

```text
Database
   ↓
Queryable Projection
   ↓
Application Model
   ↓
API/UI Consumer
```

This is particularly powerful with LINQ and EF Core because the projection can be translated into SQL.

Compare:

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

with:

```csharp
var result = await db.Customers
    .Select(CustomerListItem.Projection)
    .ToListAsync();
```

Explain the conceptual difference:

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

Do not imply that every projection must be database-backed. Explain that projections can also operate on in-memory objects.

## Explain the relationship to existing concepts

Be intellectually honest here.

Explicitly compare Projection-Oriented Modeling with:

* DTOs
* object mapping
* manual mapping
* AutoMapper
* Mapster
* Mapperly
* LINQ projections
* EF Core projections
* CQRS read models
* database views
* DDD value objects/read models

The article should acknowledge that **projection itself is not a new concept**.

The potential novelty is the modeling philosophy:

> Treating projections as first-class models and making the relationship between source and projection explicit, rather than treating mapping as a separate infrastructure concern.

Do not falsely claim that Projection-Oriented Modeling invented projections.

Instead, explain that POM attempts to unify several existing practices under one modeling principle.

## Introduce Facets

Then introduce **Facet** as a concrete .NET implementation of these ideas.

Facet is a C# source generator focused on generating facetted models from existing source models.

Use examples based on the actual Facet API and capabilities. Verify the current Facet API/documentation before writing exact code because the library evolves.

Explain the conceptual relationship:

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

Make it clear:

> POM is the architectural/modeling idea. Facet is one implementation of that idea for the .NET ecosystem.

## Explain Facet's philosophy

Discuss the philosophy behind:

> Define less, project more.

Explain that instead of manually maintaining:

```text
Entity
DTO
DTO mapper
Projection expression
Reverse mapper
```

Facet can derive much of this from the relationship between the source model and the facet.

Show a representative example such as:

```csharp
[Facet(typeof(Customer))]
public partial class CustomerListItem
{
    public int Id { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
}
```

Then explain conceptually what can be generated:

```text
Customer
   │
   └── CustomerListItem
          ├── model
          ├── construction
          ├── mapping
          └── query projection
```

Use the exact current Facet APIs where possible rather than inventing APIs.

## Explain why source generation matters

Discuss why this pattern pairs naturally with compile-time generation.

Compare:

```text
Runtime mapper

Application
    ↓
Mapper configuration
    ↓
Runtime reflection/execution
```

with:

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

Discuss benefits such as:

* compile-time feedback
* generated code being inspectable
* no runtime mapping configuration
* strong typing
* easier refactoring
* potential performance advantages
* projection expressions that can be consumed by LINQ providers

Avoid making unsupported absolute performance claims.

## Explain EF Core usage

Show how a facet/projection can be used directly with EF Core.

Use a realistic example:

```csharp
var customers = await db.Customers
    .Select(CustomerListItem.Projection)
    .ToListAsync();
```

Explain why this matters.

The application does not necessarily need:

```text
SELECT *
```

followed by an in-memory transformation.

Instead, the projection can become part of the query itself.

Explain nested projections as well, if supported by the current Facet version.

For example:

```text
Customer
 ├── Id
 ├── Name
 └── Address
       └── City
```

becoming:

```text
CustomerSummary
 ├── Id
 ├── Name
 └── City
```

Discuss flattening and nested projections where appropriate.

## Distinguish projection from transformation

This is an important conceptual section.

Explain that not every mapping is a projection.

For example:

```text
CustomerEntity → CustomerListItem
```

may be a projection.

But:

```text
LegacyCustomer → NewCustomer
```

could be a true transformation.

Likewise:

```text
CreateCustomerRequest → CreateCustomerCommand
```

may represent a semantic translation between boundaries rather than a projection.

Create a distinction such as:

```text
Projection
    "Give me a different view of this model."

Transformation
    "Convert this model into another representation."

Translation
    "Cross a semantic/application boundary."
```

Explain that POM is primarily concerned with the first category.

This prevents the article from becoming a claim that all mapping should disappear.

## Discuss when POM works well

Give practical scenarios:

### API responses

```text
Customer
    ↓
CustomerResponse
```

### List/search models

```text
Customer
    ↓
CustomerSearchResult
```

### Detail pages

```text
Customer
    ↓
CustomerDetails
```

### EF Core queries

```text
IQueryable<Customer>
    ↓
IQueryable<CustomerListItem>
```

### UI models

Explain that a UI often needs only a very specific subset of a domain/application model.

### Reporting/read scenarios

Explain that projections are naturally useful when the consumer requires a specific shape.

## Discuss when NOT to use it

Be balanced.

POM should not be presented as a universal replacement for mapping.

Discuss situations such as:

* migrations between genuinely different models
* external system integrations
* semantic transformations
* legacy-to-modern model conversions
* models with intentionally different invariants
* cases where the source and destination merely happen to have similar properties but represent different concepts

Use the principle:

> Similar shape does not necessarily mean same model.

## Include a comparison table

Create a table similar to:

| Approach                     | Primary question                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------- |
| Manual mapping               | How do I convert A into B?                                                       |
| AutoMapper/Mapster           | How can mapping A → B be automated?                                              |
| EF projection                | How do I query only the fields I need?                                           |
| DTO modeling                 | What shape should cross this boundary?                                           |
| Projection-Oriented Modeling | What view of the source model does this consumer need?                           |
| Facet                        | How can that projection relationship be expressed and generated at compile time? |

Do not portray one approach as universally superior.

## Explore the architectural consequences

This should be one of the most interesting parts of the article.

Discuss what happens when projections become first-class concepts.

For example:

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

Instead of a large collection of unrelated DTOs and mapper classes, the application has explicitly named views of its models.

Discuss how this can make dependencies and data requirements more visible.

Also discuss the potential downside: too many projections/facets can create a large model surface. The article should acknowledge this as a trade-off.

## Give the pattern a formal definition

Create a concise pattern definition:

### Projection-Oriented Modeling

**Intent**

Model consumer-specific representations as explicit projections of an existing model, rather than treating them primarily as independently maintained models connected by mapping code.

**Problem**

Applications frequently require many representations of the same underlying data. Traditional mapping introduces repetitive transformation code and can separate query shape from consumer shape.

**Solution**

Define consumer-specific models as projections of a source model and derive the required transformation/query projection from that relationship wherever practical.

**Benefits**

* explicit relationships between models
* compile-time discoverability
* reusable projections
* efficient query composition
* less repetitive mapping code
* clearer consumer-specific data requirements

**Trade-offs**

* projection definitions can multiply
* not every model relationship is a projection
* complex transformations may still require explicit mapping
* source and projection lifecycles can become coupled
* generated abstractions require tooling

## End with a broader question

Do not end with "therefore Facet is the best mapper."

Instead end with the larger architectural question:

> What if we stopped thinking of DTOs as things we map to, and started thinking of them as views we project?

Then connect this back to Facet:

> Facet is one practical attempt to make that idea explicit in C#.

The ending should invite developers to think differently about modeling rather than simply promoting a library.

## Style

Use a confident but intellectually honest technical tone.

Avoid marketing language such as:

* "revolutionary"
* "game-changing"
* "the future"
* "the only solution"
* "finally solves mapping"

Do not claim that Projection-Oriented Modeling is universally new or that no one has previously described similar ideas. Explicitly acknowledge related concepts and explain what distinction this formulation attempts to make.

Use diagrams extensively.

Use complete C# examples.

Prefer practical examples over abstract terminology.

The article should feel like an experienced .NET developer discovered a useful architectural pattern through solving real problems with source generation, LINQ, EF Core, DTOs, and Facet—and is now attempting to articulate that pattern clearly for others.
