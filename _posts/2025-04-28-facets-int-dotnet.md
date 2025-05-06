---
comment_issue_id: 4
---

# Facets in .NET

> One part of an object, situation, subject that has many parts.

Ever find yourself drowning in hand-written DTOs, mapping methods, and endless AutoMapper profiles? Facetting brings compile-time code generation: define lightweight projections (DTOs, API models, ViewModels) directly from your domain models — no boilerplate, zero runtime cost.

**Facet on [GitHub](https://github.com/Tim-Maes/Facet) & Facet on [NuGet](https://www.nuget.org/packages/Facet)**

**Facet** is a C# source generator that emits partial classes, records, structs or record structs with:

- Public properties/fields matching your source type  
- Strongly-typed constructors  
- LINQ-ready projection expressions  
- Pluggable custom mappings  
- EF Core integration through `Facet.Extensions`  
… all at compile time, with zero runtime penalty.

## What is Facetting?

Facetting is the process of carving out focused views of a richer model at compile time. Instead of manually writing DTOs, mapper classes, and projection lambdas, you declare which members you care about — and the generator writes the rest.

Instead of manually writing separate DTOs, mappers, and projections, Facet allows you to declare what you want to keep — and generates everything else.

Imagine your domain model as a diamond: **Facet** chisels out exactly the face you need, leaving the rest intact.

## Why Facetting?

- **Reduce boilerplate**  
  Eliminate repeated DTO/mapping code across your solution.  
- **Zero runtime overhead**  
  All mapping logic is generated at compile time — no reflection or IL emit at runtime.  
- **Strongly Typed & Nullable-Aware**  
  Full C# compile-time safety, including nullability contracts.  
- **DRY & Performant**  
  Stay DRY without sacrificing LINQ/EF Core efficiency  

## Quick start

### 1. Install the package

```bash
dotnet add package Facet
```

### 2. Define a Facet

```csharp
using Facet;

public class Person
{
    public string Name { get; set; }
    public string Email { get; set; }
    public int Age { get; set; }
}

// Generate a DTO that excludes Email
[Facet(typeof(Person), exclude: nameof(Person.Email))]
public partial class PersonDto;
```

This generates:

- A `PersonDto(Person source)` constructor
- Public properties for Name and Age (but not Email)
- A static `Expression<Func<Person,PersonDto>>` Projection

3. Use your generated Facets

```csharp
var person = new Person { Name = "Alice", Email = "alice@example.com", Age = 30 };

// Constructor-based mapping
var dto = new PersonDto(person);

// LINQ projection
var dtos = dbContext.People
    .Select(PersonDto.Projection)
    .ToList();
```

## Advanced scenarios

### Record-style Facets

```csharp
[Facet(typeof(Person), Kind = FacetKind.Record)]
public partial record PersonRecord;
```

### Struct & Record-Struct Facets

Switch to record semantics:

```csharp
[Facet(typeof(MyStruct), Kind = FacetKind.Struct, IncludeFields = true)]
public partial struct MyStructDto;

[Facet(typeof(MyRecordStruct), Kind = FacetKind.RecordStruct)]
public partial record struct MyRecordStructDto;
```

### Custom Mapping Logic

Implement `IFacetMapConfiguration<TSource,TTarget>` to add derived or formatted fields:

```csharp
public class UserMapConfig : IFacetMapConfiguration<User, UserDto>
{
    public static void Map(User source, UserDto target)
    {
        target.FullName = $"{source.FirstName} {source.LastName}";
    }
}

[Facet(typeof(User), Configuration = typeof(UserMapConfig))]
public partial class UserDto;
```

Facet will invoke your `Map(...)` after the default constructor copy, letting you add derived properties or formatting.

## LINQ/EF Core integration

### Install Facet.Extensions:

```bash
dotnet add package Facet.Extensions
```

```csharp
using Facet.Extensions;

// Single-object mapping
var dto = person.ToFacet<Person, PersonDto>();

// Enumerable mapping (in-memory)
var dtos = people.SelectFacets<Person, PersonDto>().ToList();

// IQueryable projection (deferred)
var query = dbContext.People.SelectFacet<Person, PersonDto>();
var list  = query.ToList();

// Async with EF Core 6+
var dtosAsync = await dbContext.People
    .SelectFacet<Person, PersonDto>()
    .ToFacetsAsync(cancellationToken);

var firstDto = await dbContext.People
    .FirstFacetAsync<Person, PersonDto>(cancellationToken);
```

**Facet** lets you declare once and use everywhere, with zero runtime overhead. Check out the GitHub repo, feel free to contribute, open an issue, or give it a star!