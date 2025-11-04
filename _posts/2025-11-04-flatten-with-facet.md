---
layout: post
title: "Flatten with Facet in .NET"
date: 2025-11-04 14:00:00 +0000
tags: [source-generators, architecture, mapping, dtos, linq, csharp, dotnet]
---

<div style="text-align: center; margin: 2rem 0;">
  <a href="https://www.github.com/Tim-Maes/Facet" target="_blank">
    <img src="https://github.com/Tim-Maes/Facet/blob/master/assets/Facet.png?raw=true" alt="Facet Logo" style="max-width: 100%; width: 600px; height: auto; display: block; margin: 0 auto; border-radius: 8px;" />
  </a>
</div>

## Introduction

I'm excited to introduce the newest addition to the [Facet](https://github.com/Tim-Maes/Facet) library: the **Flatten attribute**! This powerful source generator automatically transforms hierarchical object structures into flat DTOs, eliminating the tedious manual work of creating denormalized data transfer objects.

## What is Flatten?

The `[Flatten]` attribute is a source generator that automatically discovers all properties in a nested object hierarchy and generates a flat DTO with all nested properties promoted to the top level. It handles:

- **Automatic Property Discovery**: Recursively traverses your domain model to find all flattenable properties
- **Null-Safe Access**: Generates code with null-conditional operators (`?.`) to prevent NullReferenceExceptions
- **LINQ Projection Support**: Creates static `Expression` properties for efficient Entity Framework queries
- **Flexible Configuration**: Control depth, exclude specific paths, and customize naming strategies
- **ID Filtering**: Optionally exclude foreign keys and nested IDs for cleaner API responses
 
## Why Flatten Objects?

Flattening is useful in several real-world scenarios:

### 1. API Responses

Instead of returning nested JSON with complex object graphs:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "country": {
      "name": "USA",
      "code": "US"
    }
  }
}
```

You can return a cleaner, flat structure:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "addressStreet": "123 Main St",
  "addressCity": "Springfield",
  "addressCountryName": "USA",
  "addressCountryCode": "US"
}
```

### 2. Report Generation

Reports often need all data at one level without nested objects. Flat DTOs are perfect for generating CSV files, Excel spreadsheets, or tabular reports.

### 3. Search Results

UI components displaying search results often need all relevant information in a flat list structure for easy binding and display.

### 4. Database Efficiency

Using LINQ projection expressions, you can select only the fields you need and let Entity Framework generate efficient SQL queries that run entirely in the database.

## Getting Started

### Basic Usage

Let's start with a simple example. Suppose you have these domain models:

```csharp
public class Person
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public DateTime DateOfBirth { get; set; }
    public Address Address { get; set; }
    public ContactInfo ContactInfo { get; set; }
}

public class Address
{
    public string Street { get; set; }
    public string City { get; set; }
    public string State { get; set; }
    public string ZipCode { get; set; }
    public Country Country { get; set; }
}

public class Country
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Code { get; set; }
}

public class ContactInfo
{
    public string Email { get; set; }
    public string Phone { get; set; }
}
```

To create a flattened DTO, simply add the `[Flatten]` attribute:

```csharp
[Flatten(typeof(Person))]
public partial class PersonFlatDto { }
```

That's it! The source generator will create all the properties and mapping logic for you:

```csharp
public partial class PersonFlatDto
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string AddressStreet { get; set; }
    public string AddressCity { get; set; }
    public string AddressState { get; set; }
    public string AddressZipCode { get; set; }
    public int AddressCountryId { get; set; }
    public string AddressCountryName { get; set; }
    public string AddressCountryCode { get; set; }
    public string ContactInfoEmail { get; set; }
    public string ContactInfoPhone { get; set; }

    // Constructor for easy conversion
    public PersonFlatDto(Person source) { /* generated */ }

    // Parameterless constructor
    public PersonFlatDto() { }

    // LINQ projection expression
    public static Expression<Func<Person, PersonFlatDto>> Projection { get; }
}
```

### Using the Generated DTO

There are three ways to use the generated DTO:

#### 1. Constructor-Based Mapping

```csharp
var person = await dbContext.People
    .Include(p => p.Address)
        .ThenInclude(a => a.Country)
    .Include(p => p.ContactInfo)
    .FirstAsync(p => p.Id == 1);

var dto = new PersonFlatDto(person);
```

#### 2. LINQ Projection (Recommended)

```csharp
// This runs entirely in the database - much more efficient!
var dto = await dbContext.People
    .Where(p => p.Id == 1)
    .Select(PersonFlatDto.Projection)
    .FirstAsync();
```

#### 3. Batch Projections

```csharp
var dtos = await dbContext.People
    .Where(p => p.IsActive)
    .OrderBy(p => p.LastName)
    .Select(PersonFlatDto.Projection)
    .ToListAsync();
```

## Advanced Features

### Excluding Properties

You can exclude specific properties or entire nested objects:

```csharp
// Exclude specific properties
[Flatten(typeof(Person), "DateOfBirth", "ContactInfo.Phone")]
public partial class PersonPublicDto { }

// Exclude entire nested object
[Flatten(typeof(Person), "ContactInfo")]
public partial class PersonWithoutContactDto { }
```

### Controlling Depth

By default, Flatten traverses up to 3 levels deep. You can customize this:

```csharp
// Only flatten 2 levels (Person -> Address, but not Address -> Country)
[Flatten(typeof(Person), MaxDepth = 2)]
public partial class PersonShallowDto { }

// Unlimited depth (use with caution!)
[Flatten(typeof(Person), MaxDepth = 0)]
public partial class PersonDeepDto { }
```

### Ignoring Nested IDs

Often, you don't want foreign keys and nested IDs in your API responses. The `IgnoreNestedIds` feature helps:

```csharp
public class Order
{
    public int Id { get; set; }
    public DateTime OrderDate { get; set; }
    public int CustomerId { get; set; }  // Foreign key
    public Customer Customer { get; set; }
}

public class Customer
{
    public int Id { get; set; }  // Nested ID
    public string Name { get; set; }
    public string Email { get; set; }
    public int? PreferredAddressId { get; set; }  // Another FK
    public Address PreferredAddress { get; set; }
}

[Flatten(typeof(Order), IgnoreNestedIds = true)]
public partial class OrderDisplayDto { }
```

The generated DTO will include:
- `Id` (root level ID)
- `OrderDate`
- `CustomerName`
- `CustomerEmail`
- `CustomerPreferredAddressStreet`, `CustomerPreferredAddressCity`, etc.

But will exclude:
- `CustomerId` (foreign key)
- `CustomerId` (nested ID)
- `CustomerPreferredAddressId` (nested foreign key)

This creates much cleaner API responses focused on display data rather than relational database implementation details.

### Naming Strategies

Choose how nested properties are named:

#### Prefix Strategy (Default)

Properties are prefixed with their full path:

```csharp
[Flatten(typeof(Person), NamingStrategy = FlattenNamingStrategy.Prefix)]
public partial class PersonFlatDto { }

// Generated properties:
// AddressStreet
// AddressCity
// AddressCountryName
// ContactInfoEmail
```

#### LeafOnly Strategy

Uses only the leaf property name (watch out for collisions!):

```csharp
[Flatten(typeof(Person), NamingStrategy = FlattenNamingStrategy.LeafOnly)]
public partial class PersonFlatDto { }

// Generated properties:
// Street
// City
// Name  (from Country.Name)
// Email
```

If there are collisions, numeric suffixes are added automatically:

```csharp
// If Person.Name and Address.Country.Name both exist:
// Name    (from Person.Name)
// Name2   (from Address.Country.Name)
```

## How It Works

The Flatten attribute uses C# source generators to analyze your domain models at compile time and generate optimized code. Here's what happens behind the scenes:

1. **Discovery**: The generator recursively walks your source type's property tree
2. **Filtering**: Properties are filtered based on exclusion rules, depth limits, and type classifications
3. **Naming**: Property names are generated using your chosen naming strategy
4. **Code Generation**: Three things are generated:
   - Properties with XML documentation showing the source path
   - A constructor that uses null-conditional operators for safe access
   - A LINQ `Expression` for database projections

### Type Classification

The generator intelligently classifies types:

- **Leaf Types** (flattened as properties): primitives, strings, enums, DateTime, Guid, Decimal, simple value types (0-2 properties)
- **Complex Types** (recursed into): reference types with properties, value types with 3+ properties
- **Collections** (completely ignored): Lists, Arrays, IEnumerable, etc.

### Safety Features

- **Null Safety**: All nested property access uses null-conditional operators (`?.`)
- **Recursion Protection**: Tracks visited types to prevent infinite loops
- **Depth Limiting**: Default max depth of 3, with a hard safety limit of 10
- **Collision Handling**: Automatically adds numeric suffixes when property names collide

## Flatten vs. Facet with NestedFacets

You might wonder: how does Flatten differ from the existing `[Facet]` attribute with `NestedFacets`?

| Feature | [Flatten] | [Facet] with NestedFacets |
|---------|-----------|---------------------------|
| **Structure** | All properties at top level | Preserves nested structure |
| **Naming** | `AddressStreet` | Nested object with `Address.Street` |
| **BackTo Method** | No (one-way only) | Yes (bidirectional) |
| **Use Case** | Read-only projections, API responses | Full CRUD, bidirectional domain mapping |
| **Flexibility** | Automatic, less control | Explicit, more control |

**Key Takeaway**: Use `[Flatten]` for denormalized, read-only views (like API responses, reports, exports). Use `[Facet]` when you need bidirectional mapping with the ability to update source objects.

## Best Practices

### 1. Use Projections for Database Queries

Always prefer LINQ projections over constructor-based mapping when querying databases:

```csharp
// Good - runs in database
var dtos = await dbContext.People
    .Select(PersonFlatDto.Projection)
    .ToListAsync();

// Not optimal - loads entire object graphs into memory first
var dtos = await dbContext.People
    .Include(p => p.Address)
        .ThenInclude(a => a.Country)
    .ToListAsync()
    .Select(p => new PersonFlatDto(p))
    .ToList();
```

### 2. Limit Depth Appropriately

Don't flatten too deep unless necessary. Deep nesting can create DTOs with dozens of properties:

```csharp
// Usually sufficient
[Flatten(typeof(Order), MaxDepth = 3)]
public partial class OrderDto { }
```

### 3. Exclude Sensitive Data

Always exclude sensitive information from API DTOs:

```csharp
[Flatten(typeof(Employee), "Salary", "SSN", "BankAccount")]
public partial class EmployeePublicDto { }
```

### 4. Use IgnoreNestedIds for Display DTOs

Clean up your API responses by filtering out implementation details:

```csharp
[Flatten(typeof(Order), IgnoreNestedIds = true)]
public partial class OrderDisplayDto { }
```

### 5. Avoid Collections

Collections are not flattened (by design). If your source type has collections, they will be completely ignored:

```csharp
public class Company
{
    public string Name { get; set; }
    public List<Employee> Employees { get; set; }  // This will be ignored
}

[Flatten(typeof(Company))]
public partial class CompanyFlatDto { }
// Only has: Name property
```

If you need collection data, use nested DTOs or the regular `[Facet]` attribute instead.

## Troubleshooting

### Name Collisions

If you see properties like `Name2`, `Name3`, etc., you have naming collisions. Consider:
- Using the Prefix naming strategy (default)
- Excluding one of the conflicting properties
- Using `UseFullName = true` to include the full type name in the prefix

### Missing Properties

If properties aren't being generated:
- Check if they exceed your `MaxDepth` setting
- Verify they're not in your `Exclude` list
- Ensure the type isn't a collection (collections are always excluded)
- Check if `IgnoreNestedIds = true` is filtering them out

### Circular References

The generator tracks visited types to prevent infinite loops. If you have circular references in your domain model, the generator will stop recursing when it detects the cycle.

## Conclusion

The Flatten attribute is a powerful addition to the Facet library that eliminates the tedious work of creating flat DTOs. Whether you're building APIs, generating reports, or optimizing database queries, Flatten can save you time and reduce errors.

Key benefits:
- **Zero Boilerplate**: No manual DTO property definitions or mapping code
- **Type Safe**: Compile-time code generation means no runtime reflection
- **Null Safe**: Generated code handles null nested objects automatically
- **Efficient**: LINQ projections enable optimal database queries
- **Flexible**: Extensive configuration options for every use case

Try it out in your next project and let me know what you think!

## Installation

```bash
dotnet add package Facet
```

## Resources

- [GitHub Repository](https://github.com/Tim-Maes/Facet)
- [Full Documentation](https://github.com/Tim-Maes/Facet/blob/master/docs/11_FlattenAttribute.md)
- [NuGet Package](https://www.nuget.org/packages/Facet)

Happy flattening!
