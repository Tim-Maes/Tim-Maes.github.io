---
layout: post
title: "Facets in .NET"
date: 2025-09-28 14:00:00 +0000
tags: [source-generators, architecture, mapping, dtos, linq, csharp, dotnet]
---

<div style="text-align: center; margin: 2rem 0;">
  <a href="https://www.github.com/Tim-Maes/Facet" target="_blank">
    <img src="https://github.com/Tim-Maes/Facet/blob/master/assets/Facet.png?raw=true" alt="Facet Logo" style="max-width: 100%; width: 600px; height: auto; display: block; margin: 0 auto; border-radius: 8px;" />
  </a>
</div>


> **Disclaimer:** Facet is a fairly new library, and some things referenced in this article may be inaccurate because Facet might have had updates or changes since this was written. Please refer to the official documentation for the most current information.


## Facets in .NET

In this post, I want to highlight Facet's features and demonstrate how to use them with concrete examples. From generating your DTOs and projections, mappers and even EF Core integration, to advanced features and best practices. After covering practical usage, we'll dive deep into the theoretical foundations and implementation details.

## Introduction: The Problem with Traditional DTOs

If you've worked with modern C# applications, you've likely written code like this countless times:

```csharp
public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public decimal Salary { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Now you need a DTO for your API...
public class UserDto
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    // Excluding PasswordHash and Salary for security
}

// And a mapper...
public static UserDto ToDto(this User user)
{
    return new UserDto
    {
        Id = user.Id,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Email = user.Email
    };
}
```

This pattern is repetitive, error-prone, and becomes a maintenance nightmare as your domain models grow. When you add a property to `User`, you need to remember to update every DTO, every mapper, and every LINQ projection. Miss one, and you've got a bug.

## What is Facetting?

Think of a diamond. The whole stone is your domain model—it contains everything about the entity. But when you view it from different angles, you see different **facets**, specific views that show only what matters from that perspective.

> **Facet** - "One part of an object, situation, or subject that has many parts."

In software terms, **facetting** is the process of defining focused, compile-time views of your domain models. Instead of manually creating DTOs and mappers, you declare what you want, and Facet generates everything at compile-time using C# source generators.

### The Key Benefits

- **Zero runtime cost**: Everything is generated at compile time
- **Type-safe**: Compiler errors if you reference properties that don't exist
- **No reflection**: Pure C# code generation
- **Automatic maintenance**: Change your domain model, and facets update automatically
- **Works everywhere**: LINQ, Entity Framework Core, APIs, anywhere you need projections

## Getting Started

First, install Facet via NuGet:

```bash
dotnet add package Facet
dotnet add package Facet.Extensions        # For mapping helpers
dotnet add package Facet.Extensions.EFCore # For EF Core integration
dotnet add package Facet.Mapping           # For custom mappings
```

## Understanding Facets: The Basics

Let's start with a simple example. Say you have a `User` entity:

```csharp
public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public decimal Salary { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

To create a public-facing facet that excludes sensitive data, you can simply:

```csharp
[Facet(typeof(User), "PasswordHash", "Salary")]
public partial record UserPublicDto;

// Or with explicit exclude parameter
[Facet(typeof(User), exclude: ["PasswordHash", "Salary"])]
public partial class UserPublicDto
{
    public string ExtraProperty { get; set; }
}
```

That's it! Facet generates a complete record with:

- All properties from `User` except `PasswordHash` and `Salary`
- A constructor for creating instances
- LINQ projection expressions
- Mapping methods

Using it is just as simple:

```csharp
// Single object mapping
User user = GetUserFromDatabase();
var dto = user.ToFacet<UserPublicDto>();

// Collection mapping
List<User> users = GetUsers();
var dtos = users.SelectFacets<UserPublicDto>();

// In EF Core queries - automatic SQL projection!
var dtos = await dbContext.Users
    .Where(u => u.IsActive)
    .SelectFacet<UserPublicDto>()
    .ToListAsync();
```

## The Include vs Exclude Pattern

Facet gives you two strategies for defining what goes into your facet:

### Exclude Pattern (Default)

Use this when you want most of the properties but need to hide a few:

```csharp
// Everything except these fields
[Facet(typeof(User), "PasswordHash", "Salary", "InternalNotes")]
public partial record UserApiDto;
```

### Include Pattern

Use this when you want only specific properties:

```csharp
// Only these fields
[Facet(typeof(User), Include = ["FirstName", "LastName", "Email"])]
public partial record UserContactDto;
```

This is perfect for filter DTOs or search forms where you only need a subset of properties.

## Handling Complex Domain Objects: Nested Facets

Real-world applications have complex object graphs. Here's how Facet handles them elegantly.

### Step 1: Define Your Domain Models

```csharp
public class Address
{
    public string Street { get; set; }
    public string City { get; set; }
    public string State { get; set; }
    public string ZipCode { get; set; }
    public string Country { get; set; }
}

public class Company
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Industry { get; set; }
    public Address Headquarters { get; set; }
}

public class Employee
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public decimal Salary { get; set; }
    public Company Company { get; set; }
    public Address HomeAddress { get; set; }
    public DateTime HireDate { get; set; }
}
```

### Step 2: Create Facets from Bottom-Up

```csharp
// 1. Start with Address - it has no dependencies
[Facet(typeof(Address))]
public partial record AddressDto;

// 2. Create Company facet - it references Address
[Facet(typeof(Company), NestedFacets = [typeof(AddressDto)])]
public partial record CompanyDto;

// 3. Create Employee facet - it references both
[Facet(typeof(Employee),
    exclude: ["PasswordHash", "Salary"],
    NestedFacets = [typeof(CompanyDto), typeof(AddressDto)])]
public partial record EmployeeDto;
```

What happens here?

When Facet generates `EmployeeDto`, it:

- Copies basic properties from `Employee`
- Automatically maps `Company` → `CompanyDto`
- Automatically maps `Address` → `AddressDto`
- Generates proper constructors and projections that handle all the nesting

Using it is seamless:

```csharp
Employee employee = GetEmployee();
var dto = employee.ToFacet<EmployeeDto>();

// dto.Company is now CompanyDto
// dto.Company.Headquarters is now AddressDto
// dto.HomeAddress is now AddressDto
```

### Step 3: Handling Collections

Collections work automatically! Facet intelligently maps `List<T>`, arrays, `IEnumerable<T>`, `ICollection<T>`, etc.

```csharp
public class Order
{
    public int Id { get; set; }
    public string OrderNumber { get; set; }
    public DateTime OrderDate { get; set; }
    public List<OrderItem> Items { get; set; }
    public Address ShippingAddress { get; set; }
}

public class OrderItem
{
    public int Id { get; set; }
    public string ProductName { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
}

// Define the facets
[Facet(typeof(OrderItem))]
public partial record OrderItemDto;

[Facet(typeof(Order), NestedFacets = [typeof(OrderItemDto), typeof(AddressDto)])]
public partial record OrderDto;

// Usage - List<OrderItem> automatically becomes List<OrderItemDto>!
var orderDto = order.ToFacet<OrderDto>();
```

### Complex Multi-Level Nesting

```csharp
public class Department
{
    public int Id { get; set; }
    public string Name { get; set; }
    public Company Company { get; set; }
    public Employee Manager { get; set; }
    public List<Employee> Staff { get; set; }
}

[Facet(typeof(Department),
    NestedFacets = [typeof(CompanyDto), typeof(EmployeeDto)])]
public partial record DepartmentDto;

// This automatically handles:
// - Department.Company → CompanyDto
// - Department.Company.Headquarters → AddressDto (nested in CompanyDto)
// - Department.Manager → EmployeeDto
// - Department.Manager.Company → CompanyDto
// - Department.Manager.HomeAddress → AddressDto
// - Department.Staff → List<EmployeeDto>
// And all their nested properties!
```

## Handling Circular References with MaxDepth and PreserveReferences

Facet provides two complementary mechanisms to handle these scenarios safely. Consider these common scenarios:

```csharp
// Scenario 1: Bidirectional references
public class Author
{
    public int Id { get; set; }
    public string Name { get; set; }
    public List<Book> Books { get; set; }  // Author references Books
}

public class Book
{
    public int Id { get; set; }
    public string Title { get; set; }
    public Author Author { get; set; }  // Book references Author - circular!
}

// Scenario 2: Self-referencing (organizational hierarchy)
public class Employee
{
    public int Id { get; set; }
    public string Name { get; set; }
    public Employee Manager { get; set; }           // Points up the hierarchy
    public List<Employee> DirectReports { get; set; }  // Points down - circular!
}
```

Without protection, trying to create facets for these models would cause:

- **Compile-time issues**: Source generator stack overflow
- **Runtime issues**: Infinite recursion when constructing facets
- **IDE crashes**: Visual Studio/Rider hanging during code generation

### MaxDepth

`MaxDepth` controls how many levels deep the source generator will recurse when creating nested facets. The default value is 3.

```csharp
// Define facets with circular references - MaxDepth prevents infinite recursion
[Facet(typeof(Author), MaxDepth = 2, NestedFacets = [typeof(BookDto)])]
public partial record AuthorDto;

[Facet(typeof(Book), MaxDepth = 2, NestedFacets = [typeof(AuthorDto)])]
public partial record BookDto;
```

How it works:

The depth counter tracks nesting levels:

- **Level 0**: Root object (e.g., `Author`)
- **Level 1**: First level nested objects (e.g., `Books` collection)
- **Level 2**: Second level nested objects (e.g., `Book.Author`)
- **Level 3**: Would be `Book.Author.Books`, stopped at `MaxDepth = 2`

### PreserveReferences: Runtime Circular Detection

`PreserveReferences` enables runtime tracking of object instances to detect when the same object is being processed multiple times.

**Default value**: `true` (recommended for safety)

This prevents:

- Infinite loops when the same object appears multiple times
- Duplicate processing of shared references
- Memory exhaustion from circular object graphs

## Entity Framework Core Integration

One of Facet's most powerful features is seamless EF Core integration.

When you use `SelectFacet<T>()` in an EF Core query, Facet generates an expression tree that EF Core translates directly to SQL:

```csharp
// This generates optimal SQL with only the columns you need!
var employees = await dbContext.Employees
    .Where(e => e.IsActive)
    .SelectFacet<EmployeeDto>()
    .ToListAsync();

// SQL generated:
// SELECT e.Id, e.FirstName, e.LastName, e.Email, ...
// FROM Employees e
// WHERE e.IsActive = 1
```

### Automatic Navigation Property Loading

The magic part: **You don't need `.Include()` for nested facets!**

```csharp
// WITHOUT Facet: you need to remember to include
var employees = await dbContext.Employees
    .Include(e => e.Company)
        .ThenInclude(c => c.Headquarters)
    .Include(e => e.HomeAddress)
    .Select(e => new EmployeeDto { ... })
    .ToListAsync();

// WITH Facet: automatic!
var employees = await dbContext.Employees
    .SelectFacet<EmployeeDto>()
    .ToListAsync();

// Facet analyzes the nested facets and generates proper JOINs automatically!
```

### Reverse Mapping: Update Entities

Facet can also help with updates:

```csharp
[HttpPut("employees/{id}")]
public async Task<IActionResult> UpdateEmployee(int id, EmployeeUpdateDto dto)
{
    var employee = await dbContext.Employees.FindAsync(id);
    if (employee == null) return NotFound();

    // Updates only the properties that changed
    employee.UpdateFromFacet(dto, dbContext);

    await dbContext.SaveChangesAsync();
    return NoContent();
}

// With change tracking for auditing
var result = employee.UpdateFromFacetWithChanges(dto, dbContext);
if (result.HasChanges)
{
    logger.LogInformation(
        "Employee {Id} updated. Changed: {Properties}",
        employee.Id,
        string.Join(", ", result.ChangedProperties));
}
```

## Custom Mapping: Beyond Simple Projection

Often, your DTOs need computed properties or transformations that can't be done with simple property copying. Facet supports this through mapping configurations.

### Synchronous Custom Mapping

Let's say you want to add computed properties:

```csharp
// Define the mapper
public class UserDtoMapper : IFacetMapConfiguration<User, UserDetailDto>
{
    public static void Map(User source, UserDetailDto target)
    {
        // Computed property
        target.FullName = $"{source.FirstName} {source.LastName}";

        // Calculated age
        target.Age = CalculateAge(source.DateOfBirth);

        // Business logic
        target.MembershipLevel = DetermineMembershipLevel(source);
    }

    private static int CalculateAge(DateTime birthDate)
    {
        var today = DateTime.Today;
        var age = today.Year - birthDate.Year;
        if (birthDate.Date > today.AddYears(-age)) age--;
        return age;
    }

    private static string DetermineMembershipLevel(User user)
    {
        // Your business logic here
        return user.CreatedAt < DateTime.Now.AddYears(-5) ? "Gold" : "Silver";
    }
}

// Apply the mapper to your facet
[Facet(typeof(User),
    exclude: ["PasswordHash", "Salary"],
    Configuration = typeof(UserDtoMapper))]
public partial record UserDetailDto
{
    public string FullName { get; set; }
    public int Age { get; set; }
    public string MembershipLevel { get; set; }
}
```

The mapper executes after the basic property copying, so you can focus only on the custom logic.

### Asynchronous Custom Mapping

Sometimes you need to fetch additional data asynchronously (database lookups, API calls, etc.):

```csharp
public class UserProfileMapper : IFacetMapConfigurationAsync<User, UserProfileDto>
{
    public static async Task MapAsync(
        User source,
        UserProfileDto target,
        CancellationToken cancellationToken = default)
    {
        // Async database call
        target.ProfilePicture = await GetProfilePictureAsync(source.Id, cancellationToken);

        // Async external API call
        target.ReputationScore = await CalculateReputationAsync(source.Email, cancellationToken);

        // Regular computed property
        target.FullName = $"{source.FirstName} {source.LastName}";
    }

    private static async Task<string> GetProfilePictureAsync(int userId, CancellationToken ct)
    {
        // Your async logic here
        await Task.Delay(100, ct); // Simulated async work
        return $"https://cdn.example.com/avatars/{userId}.jpg";
    }

    private static async Task<int> CalculateReputationAsync(string email, CancellationToken ct)
    {
        // Call external service
        await Task.Delay(100, ct);
        return 850;
    }
}

[Facet(typeof(User), "PasswordHash", "Salary")]
public partial record UserProfileDto
{
    public string FullName { get; set; }
    public string ProfilePicture { get; set; }
    public int ReputationScore { get; set; }
}

// Usage - note the async methods
var dto = await user.ToFacetAsync<User, UserProfileDto, UserProfileMapper>();

// For collections - parallel execution!
var dtos = await users.ToFacetsParallelAsync<User, UserProfileDto, UserProfileMapper>();
```

### Dependency Injection in Mappers

For more complex scenarios, you can inject services into your mappers:

```csharp
public class UserEnrichedMapper : IFacetMapConfigurationAsyncInstance<User, UserEnrichedDto>
{
    private readonly IProfileService _profileService;
    private readonly ILocationService _locationService;
    private readonly ILogger<UserEnrichedMapper> _logger;

    public UserEnrichedMapper(
        IProfileService profileService,
        ILocationService locationService,
        ILogger<UserEnrichedMapper> logger)
    {
        _profileService = profileService;
        _locationService = locationService;
        _logger = logger;
    }

    public async Task MapAsync(
        User source,
        UserEnrichedDto target,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Use injected services
            target.ProfileData = await _profileService.GetProfileAsync(source.Id, cancellationToken);
            target.Location = await _locationService.GetLocationAsync(source.Id, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to enrich user {UserId}", source.Id);
            throw;
        }
    }
}

// Usage with DI
var mapper = serviceProvider.GetRequiredService<UserEnrichedMapper>();
var dto = await user.ToFacetAsync(mapper);
```

## Advanced Features

### Nullable Properties for Query DTOs

Need a filter DTO where all properties are nullable (for optional filters)?

```csharp
[Facet(typeof(User),
    Include = ["FirstName", "LastName", "Email", "IsActive"],
    NullableProperties = true,
    GenerateBackTo = false)]
public partial record UserFilterDto;

// All properties are nullable:
// string? FirstName, string? LastName, bool? IsActive, etc.

// Perfect for query parameters!
public async Task<List<UserDto>> SearchUsers(UserFilterDto filter)
{
    var query = dbContext.Users.AsQueryable();

    if (filter.FirstName != null)
        query = query.Where(u => u.FirstName.Contains(filter.FirstName));

    if (filter.LastName != null)
        query = query.Where(u => u.LastName.Contains(filter.LastName));

    if (filter.IsActive.HasValue)
        query = query.Where(u => u.IsActive == filter.IsActive.Value);

    return await query.SelectFacet<UserDto>().ToListAsync();
}
```

### Copy Data Annotations

Preserve validation attributes from your domain models:

```csharp
public class User
{
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; }

    [EmailAddress]
    public string Email { get; set; }
}

[Facet(typeof(User),
    Include = ["FirstName", "Email"],
    CopyAttributes = true)]
public partial record UserRegistrationDto;

// Generated with attributes preserved:
// [Required]
// [StringLength(100)]
// public string FirstName { get; init; }
//
// [EmailAddress]
// public string Email { get; init; }
```

### Generate Multiple Output Types

Facets can be classes, records, structs, or record structs:

```csharp
[Facet(typeof(User))]
public partial class UserClass;

[Facet(typeof(User))]
public partial record UserRecord;

[Facet(typeof(User))]
public partial struct UserStruct;

[Facet(typeof(User))]
public partial record struct UserRecordStruct;
```

### Auto-Generate CRUD DTOs

For rapid API development, auto-generate standard CRUD DTOs:

```csharp
[GenerateDtos(Types = DtoTypes.All, OutputType = OutputType.Record)]
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Automatically generates:
// - CreateProductRequest (excludes Id, CreatedAt)
// - UpdateProductRequest (includes Id)
// - ProductResponse (includes everything)
// - ProductQuery (all properties nullable)
// - UpsertProductRequest (for create or update)
```

With smart audit field exclusions:

```csharp
[GenerateAuditableDtos(
    Types = DtoTypes.Create | DtoTypes.Update,
    ExcludeProperties = ["Password"])]
public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Password { get; set; }
    public DateTime CreatedAt { get; set; }  // Auto-excluded
    public string CreatedBy { get; set; }     // Auto-excluded
    public DateTime UpdatedAt { get; set; }   // Auto-excluded
    public string UpdatedBy { get; set; }     // Auto-excluded
}
```

## Best Practices

### 1. Use Meaningful Facet Names

Name your facets based on their purpose, not just appending "Dto":

```csharp
// ❌ Generic names
public partial record UserDto;

// ✅ Descriptive names
public partial record UserPublicProfile;
public partial record UserAdminView;
public partial record UserSearchResult;
public partial record UserRegistrationRequest;
```

### 2. Create Facets Bottom-Up

Always create facets for leaf nodes first, then build up:

```csharp
// ✅ Correct order
[Facet(typeof(Address))]              // No dependencies
public partial record AddressDto;

[Facet(typeof(Company), NestedFacets = [typeof(AddressDto)])]
public partial record CompanyDto;     // Depends on AddressDto

[Facet(typeof(Employee), NestedFacets = [typeof(CompanyDto), typeof(AddressDto)])]
public partial record EmployeeDto;    // Depends on both
```

### 3. Use Exclude for Public APIs, Include for Specific Use Cases

```csharp
// ✅ For public APIs - hide sensitive data
[Facet(typeof(User), "PasswordHash", "Salary", "SSN")]
public partial record UserPublicApi;

// ✅ For specific features - only what's needed
[Facet(typeof(User), Include = ["Id", "FirstName", "LastName"])]
public partial record UserAutocomplete;
```

### 4. Keep Mappers Focused

Don't put business logic in mappers—keep them for presentation concerns only:

```csharp
// ✅ Good - presentation logic
public class UserMapper : IFacetMapConfiguration<User, UserDto>
{
    public static void Map(User source, UserDto target)
    {
        target.FullName = $"{source.FirstName} {source.LastName}";
        target.DisplayAge = $"{CalculateAge(source.DateOfBirth)} years old";
        target.MemberSince = source.CreatedAt.ToString("MMMM yyyy");
    }
}

// ❌ Bad - business logic belongs in domain layer
public class UserMapper : IFacetMapConfiguration<User, UserDto>
{
    public static void Map(User source, UserDto target)
    {
        // Don't do this - business logic should be in domain
        target.CanPurchase = source.Age >= 18 && source.AccountStatus == "Active";
        target.CreditLimit = CalculateCreditLimit(source); // Business logic!
    }
}
```

## Performance Considerations

Facet is built for performance:

- **Compile-time generation**: Zero runtime overhead
- **No reflection**: Pure C# code
- **Optimal SQL**: Only fetches needed columns in EF Core
- **Competitive with hand-written code**: Benchmarks show performance on par with or better than popular alternatives

### Benchmark Results

All libraries perform within ~10% of each other—the real benefit of Facet is developer productivity and maintainability.

**Single object mapping:**

- Facet: 15.93 ns, 136 B allocated
- Mapperly: 15.09 ns, 128 B allocated
- Mapster: 21.90 ns, 128 B allocated

**Collection mapping (10 items):**

- Mapster: 192.55 ns, 1,416 B allocated
- Facet: 207.32 ns, 1,568 B allocated
- Mapperly: 222.50 ns, 1,552 B allocated

---

## Deep Dive: Under the Hood

Now that we've covered practical usage, let's explore the theoretical foundations and implementation details that make Facet work.

## 2. Problem Analysis

### 2.1 The Projection Proliferation Problem

Modern applications exhibit a characteristic pattern we term "projection proliferation" - the exponential growth of mapping code as application complexity increases. Consider a typical e-commerce system where a `Product` entity requires different projections for:

- **API responses**: Public properties excluding internal metadata
- **Search indexes**: Denormalized data optimized for full-text search
- **Administrative interfaces**: Complete entity data including audit trails
- **Mobile applications**: Bandwidth-optimized minimal datasets
- **External integrations**: Schema-compliant data structures
- **Caching layers**: Serialization-optimized representations

### 2.2 Traditional Mapping Approaches

#### 2.2.1 Manual Mapping

```csharp
public class ProductSummaryDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    // ... properties
}

public static class ProductMapper
{
    public static ProductSummaryDto ToSummaryDto(Product product)
    {
        return new ProductSummaryDto
        {
            Id = product.Id,
            Name = product.Name,
            Price = product.Price,
            // ... property assignments
        };
    }
}
```

**Analysis:** While providing maximum control, manual mapping scales poorly. Each new projection requires complete implementation and maintenance. Error-prone property assignments lead to runtime bugs that could be prevented at compile time.

### 2.3 Maintenance Overhead Analysis

In a typical enterprise application with 50 domain entities requiring an average of 4 projections each, traditional approaches result in:

- **Manual mapping:** 200 DTO classes + 200 mapper classes = 400 files to maintain
- **Facet:** 200 DTO declarations (partial classes) = 200 files, minimal maintenance

## 3. Theoretical Foundation

### 3.1 Facetting as a Design Pattern

Facetting represents a formalization of the projection pattern, drawing inspiration from both the Adapter and Facade patterns while maintaining strong compile-time guarantees. The concept is rooted in three fundamental principles:

#### 3.1.1 Selective Exposure

A facet exposes only the properties relevant to a specific context, creating a focused view of a larger model. This principle supports the Interface Segregation Principle by ensuring consumers only depend on the data they actually need.

#### 3.1.2 Compile-Time Generation

Unlike runtime mapping solutions, facetting occurs entirely at compile time through source generators. This approach provides several advantages:

- Zero runtime performance overhead
- Full IntelliSense support for generated code
- Compile-time error detection for mapping issues
- Debugger support for generated mapping logic

#### 3.1.3 Type Safety Preservation

Facets maintain complete type safety including nullable reference type annotations, generic constraints, and custom attributes. This ensures that the compiler can provide the same level of safety guarantees as manually written code.

### 3.2 Mathematical Model

We can model facetting as a function F that takes a source type S and a specification σ to produce a target type T:

```
F: (S, σ) → T

where:
- S is the source type with properties {p₁, p₂, ..., pₙ}
- σ is the specification defining included/excluded properties
- T is the generated target type with properties {q₁, q₂, ..., qₘ}
- m ≤ n (target has equal or fewer properties than source)
```

The mapping function M between instances follows:

```
M: S → T
M(s) = t where t.qᵢ = s.pⱼ for all valid property mappings
```

### 3.3 Complexity Analysis

The time complexity of facet generation is O(n) where n is the number of properties in the source type. The space complexity is O(m) where m is the number of properties in the target type. This linear relationship ensures scalability as model complexity grows.

## 4. Implementation Architecture

### 4.1 Source Generator Pipeline

The Facet source generator implements the IIncrementalGenerator interface to leverage Roslyn's incremental compilation capabilities. The pipeline consists of four main stages:

#### 4.1.1 Attribute Discovery

```csharp
// Stage 1: Discover types annotated with [Facet] attributes
var facetTargets = context.SyntaxProvider
    .CreateSyntaxProvider(
        predicate: static (s, _) => IsFacetCandidate(s),
        transform: static (ctx, _) => GetFacetTarget(ctx))
    .Where(static m => m is not null);
```

#### 4.1.2 Semantic Analysis

```csharp
// Stage 2: Analyze semantic model for type information
var semanticModels = facetTargets
    .Combine(context.CompilationProvider)
    .Select(static (x, _) => AnalyzeSemantics(x.Left, x.Right));
```

#### 4.1.3 Code Generation Model Building

```csharp
// Stage 3: Build generation models
var generationModels = semanticModels
    .Select(static (x, _) => BuildGenerationModel(x))
    .Where(static m => m.IsValid);
```

#### 4.1.4 Source Code Emission

```csharp
// Stage 4: Generate source code
generationModels.RegisterSourceOutput(context,
    static (ctx, model) => EmitSourceCode(ctx, model));
```

### 4.2 Type System Integration

Facet integrates deeply with the C# type system to support modern language features:

#### 4.2.1 Nullable Reference Types

```csharp
// Source type with nullable annotations
public class User
{
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

// Generated facet preserves nullability
[Facet(typeof(User))]
public partial class UserDto;
```

#### 4.2.2 Generic Type Support

```csharp
// Generic source types are fully supported
public class Repository<T> where T : class
{
    public IEnumerable<T> Items { get; set; }
    public int Count { get; set; }
}

[Facet(typeof(Repository<>))]
public partial class RepositoryDto<T> where T : class
{
    // Generated with proper generic constraints
}
```

## 5. Source Generator Internals

### 5.1 Incremental Generation Strategy

Facet leverages Roslyn's incremental generator architecture to minimize compilation overhead. The implementation uses a multi-stage pipeline that caches intermediate results and only regenerates code when dependencies change.

#### 5.1.1 Change Detection

```csharp
// Efficient change detection using content-based caching
public void Initialize(IncrementalGeneratorInitializationContext context)
{
    var facetDeclarations = context.SyntaxProvider
        .CreateSyntaxProvider(
            predicate: static (node, _) => IsFacetDeclaration(node),
            transform: static (ctx, ct) => ExtractFacetInfo(ctx, ct))
        .Where(static x => x is not null);

    // Combine with compilation to access semantic model
    var compilationAndFacets = context.CompilationProvider
        .Combine(facetDeclarations.Collect());

    context.RegisterSourceOutput(compilationAndFacets,
        static (ctx, source) => GenerateFacetCode(ctx, source));
}
```

### 5.2 Symbol Analysis

The generator performs comprehensive symbol analysis to extract type information while preserving all metadata:

#### 5.2.1 Property Analysis

```csharp
private static FacetMember AnalyzeProperty(IPropertySymbol property)
{
    return new FacetMember(
        Name: property.Name,
        TypeName: GetFullTypeName(property.Type),
        Kind: FacetMemberKind.Property,
        IsInitOnly: property.SetMethod?.IsInitOnly == true,
        IsRequired: property.IsRequired,
        IsNullable: property.Type.CanBeReferencedByName &&
                   property.NullableAnnotation == NullableAnnotation.Annotated,
        XmlDocumentation: ExtractDocumentation(property),
        Attributes: ExtractAttributes(property)
    );
}
```

#### 5.2.2 Generic Type Handling

```csharp
private static string GetFullTypeName(ITypeSymbol type)
{
    return type switch
    {
        INamedTypeSymbol namedType when namedType.IsGenericType =>
            $"{namedType.Name}<{string.Join(", ", namedType.TypeArguments.Select(GetFullTypeName))}>",
        IArrayTypeSymbol arrayType =>
            $"{GetFullTypeName(arrayType.ElementType)}[]",
        _ => type.ToDisplayString(SymbolDisplayFormat.FullyQualifiedFormat)
    };
}
```

### 5.3 Code Generation Templates

Facet uses template-based code generation with optimized string building to minimize memory allocations during compilation:

#### 5.3.1 Constructor Generation

```csharp
private static void GenerateConstructor(StringBuilder sb, FacetModel model)
{
    sb.AppendLine($"    public {model.Name}({model.SourceTypeFullName} source)");

    if (model.Kind is FacetKind.Record or FacetKind.RecordStruct &&
        !model.HasExistingPrimaryConstructor)
    {
        // Positional record constructor
        var parameters = string.Join(", ",
            model.Members.Select(m => $"source.{m.Name}"));
        sb.AppendLine($"        : this({parameters})");
    }
    else
    {
        // Property assignment constructor
        sb.AppendLine("    {");
        foreach (var member in model.Members)
        {
            if (member.NeedsCustomMapping)
            {
                sb.AppendLine($"        // {member.Name} handled by custom mapper");
            }
            else
            {
                sb.AppendLine($"        this.{member.Name} = source.{member.Name};");
            }
        }

        if (!string.IsNullOrEmpty(model.ConfigurationTypeName))
        {
            sb.AppendLine($"        {model.ConfigurationTypeName}.Map(source, this);");
        }

        sb.AppendLine("    }");
    }
}
```

### 5.4 LINQ Expression Generation

For database integration, Facet generates optimized LINQ expressions that can be translated to SQL:

```csharp
private static void GenerateProjectionExpression(StringBuilder sb, FacetModel model)
{
    sb.AppendLine($"    public static Expression<Func<{model.SourceTypeFullName}, {model.Name}>> Projection =>");

    if (model.HasCustomMapping)
    {
        // Complex projections require materialization first
        sb.AppendLine($"        source => {model.ConfigurationTypeName}.Map(source, null);");
    }
    else
    {
        // Simple projections can be translated to SQL
        sb.AppendLine($"        source => new {model.Name}(source);");
    }
}
```

### 5.5 Error Handling and Diagnostics

Comprehensive error reporting helps developers identify and resolve configuration issues at compile time:

```csharp
private static void ReportDiagnostics(SourceProductionContext context, FacetModel model)
{
    // Check for missing source properties
    foreach (var excludedProperty in model.ExcludedProperties)
    {
        if (!model.SourceProperties.Contains(excludedProperty))
        {
            var descriptor = new DiagnosticDescriptor(
                "FACET001",
                "Excluded property not found",
                $"Property '{excludedProperty}' specified in exclude list was not found on source type '{model.SourceTypeName}'",
                "Facet",
                DiagnosticSeverity.Warning,
                isEnabledByDefault: true);

            context.ReportDiagnostic(Diagnostic.Create(descriptor, model.Location));
        }
    }
}
```

## 6. Mapping Strategies

### 6.1 Simple Property Mapping

The most basic form of facetting involves direct property copying with optional exclusions:

```csharp
public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }  // Sensitive
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}

[Facet(typeof(User), exclude: new[] { nameof(User.PasswordHash) })]
public partial class UserDto
{
    // All properties except PasswordHash are generated
}
```

### 6.2 Custom Synchronous Mapping

For computed properties and transformation logic, Facet supports custom mappers:

```csharp
public class UserMapper : IFacetMapConfiguration<User, UserDto>
{
    public static void Map(User source, UserDto target)
    {
        // Computed properties
        target.FullName = $"{source.FirstName} {source.LastName}";
        target.DisplayEmail = source.Email.ToLowerInvariant();
        target.AccountAge = DateTime.UtcNow - source.CreatedAt;

        // Conditional logic
        target.StatusText = source.IsActive ? "Active" : "Inactive";

        // Format transformations
        target.CreatedAtFormatted = source.CreatedAt.ToString("MMM dd, yyyy");
    }
}

[Facet(typeof(User), Configuration = typeof(UserMapper))]
public partial class UserDto
{
    public string FullName { get; set; } = string.Empty;
    public string DisplayEmail { get; set; } = string.Empty;
    public TimeSpan AccountAge { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public string CreatedAtFormatted { get; set; } = string.Empty;
}
```

### 6.3 Asynchronous Mapping with Dependencies

For complex scenarios requiring external data sources, Facet supports asynchronous mapping with dependency injection:

#### 6.3.1 Service Configuration

```csharp
// Dependency injection setup
services.AddScoped<IUserProfileService, UserProfileService>();
services.AddScoped<IReputationService, ReputationService>();
services.AddFacetMapping(); // Registers mapping services
```

#### 6.3.2 Async Mapper Implementation

```csharp
public class UserAsyncMapper : IFacetMapConfigurationAsync<User, UserDto>
{
    public static async Task MapAsync(
        User source,
        UserDto target,
        IServiceProvider services,
        CancellationToken cancellationToken = default)
    {
        var profileService = services.GetRequiredService<IUserProfileService>();
        var reputationService = services.GetRequiredService<IReputationService>();

        // Parallel async operations for optimal performance
        var tasks = new[]
        {
            LoadProfilePictureAsync(source.Id, profileService, cancellationToken),
            CalculateReputationAsync(source.Email, reputationService, cancellationToken),
            LoadPreferencesAsync(source.Id, profileService, cancellationToken)
        };

        var results = await Task.WhenAll(tasks);

        target.ProfilePictureUrl = results[0];
        target.ReputationScore = (decimal)results[1];
        target.Preferences = (UserPreferences)results[2];
    }

    private static async Task<string> LoadProfilePictureAsync(
        int userId,
        IUserProfileService service,
        CancellationToken cancellationToken)
    {
        var profile = await service.GetProfileAsync(userId, cancellationToken);
        return profile?.ProfilePictureUrl ?? "/images/default-avatar.png";
    }
}
```

### 6.4 Hybrid Mapping Strategy

For optimal balance, Facet supports hybrid mapping that combines synchronous and asynchronous operations:

```csharp
public class UserHybridMapper : IFacetMapConfigurationHybrid<User, UserDto>
{
    // Fast synchronous operations
    public static void Map(User source, UserDto target)
    {
        target.FullName = $"{source.FirstName} {source.LastName}";
        target.DisplayEmail = source.Email.ToLowerInvariant();
        target.AccountAge = DateTime.UtcNow - source.CreatedAt;
        target.IsRecent = source.CreatedAt > DateTime.UtcNow.AddDays(-30);
    }

    // Expensive asynchronous operations
    public static async Task MapAsync(
        User source,
        UserDto target,
        IServiceProvider services,
        CancellationToken cancellationToken = default)
    {
        var externalService = services.GetRequiredService<IExternalDataService>();

        // Only perform expensive operations if needed
        if (target.IsRecent)
        {
            target.ExternalData = await externalService
                .GetDataAsync(source.Id, cancellationToken);
        }
    }
}
```

### 6.5 Collection Mapping

For collections, Facet provides convenient extension methods:

#### 6.5.1 Parallel Processing

```csharp
// Sequential mapping (default)
var userDtos = await users.ToFacetsAsync<UserDto, UserAsyncMapper>(serviceProvider);

// Parallel mapping with controlled concurrency
var userDtosParallel = await users.ToFacetsParallelAsync<UserDto, UserAsyncMapper>(
    serviceProvider,
    maxDegreeOfParallelism: Environment.ProcessorCount,
    cancellationToken: cancellationToken);

// Batch processing for database-intensive operations
var userDtosBatched = await users.ToFacetsBatchAsync<UserDto, UserAsyncMapper>(
    serviceProvider,
    batchSize: 50,
    cancellationToken: cancellationToken);
```

#### 6.5.2 Memory-Efficient Streaming

```csharp
// For very large collections, use streaming
await foreach (var userDto in users.ToFacetsStreamAsync<UserDto, UserAsyncMapper>(
    serviceProvider, cancellationToken))
{
    // Process each item as it's mapped
    await ProcessUserDto(userDto);
}
```

## 7. Advanced Scenarios

### 7.1 Nested Type Mapping

Facet supports complex object graphs with nested type transformations:

```csharp
public class Order
{
    public int Id { get; set; }
    public DateTime OrderDate { get; set; }
    public Customer Customer { get; set; }
    public List<OrderItem> Items { get; set; }
    public Address ShippingAddress { get; set; }
}

public class OrderMapper : IFacetMapConfiguration<Order, OrderDto>
{
    public static void Map(Order source, OrderDto target)
    {
        // Transform nested objects
        target.CustomerInfo = source.Customer.ToFacet<CustomerDto>();

        // Transform collections
        target.Items = source.Items
            .Select(item => item.ToFacet<OrderItemDto>())
            .ToList();

        // Transform with custom logic
        target.ShippingAddress = source.ShippingAddress?.ToFacet<AddressDto>()
                                 ?? new AddressDto { Type = "Unknown" };

        // Computed properties
        target.TotalAmount = source.Items.Sum(i => i.Price * i.Quantity);
        target.ItemCount = source.Items.Count;
    }
}
```

### 7.2 Conditional Mapping

Dynamic property inclusion based on runtime conditions:

```csharp
public class ConditionalUserMapper : IFacetMapConfiguration<User, UserDto>
{
    public static void Map(User source, UserDto target)
    {
        // Include sensitive data only for admin users
        if (IsAdmin(source))
        {
            target.InternalNotes = source.InternalNotes;
            target.LastPasswordChange = source.LastPasswordChange;
        }

        // Include premium features for premium users
        if (source.SubscriptionType == SubscriptionType.Premium)
        {
            target.PremiumFeatures = LoadPremiumFeatures(source.Id);
        }

        // Localized content based on user preferences
        target.LocalizedContent = GetLocalizedContent(
            source.PreferredLanguage,
            source.Region);
    }

    private static bool IsAdmin(User user) =>
        user.Roles.Any(r => r.Name == "Administrator");
}
```

### 7.3 Polymorphic Type Handling

Support for inheritance hierarchies and polymorphic scenarios:

```csharp
public abstract class PaymentMethod
{
    public int Id { get; set; }
    public string Type { get; set; }
    public bool IsActive { get; set; }
}

public class CreditCard : PaymentMethod
{
    public string LastFourDigits { get; set; }
    public string ExpiryMonth { get; set; }
    public string ExpiryYear { get; set; }
}

public class PayPalAccount : PaymentMethod
{
    public string Email { get; set; }
    public bool IsVerified { get; set; }
}

public class PaymentMethodMapper : IFacetMapConfiguration<PaymentMethod, PaymentMethodDto>
{
    public static void Map(PaymentMethod source, PaymentMethodDto target)
    {
        target.TypeSpecificData = source switch
        {
            CreditCard cc => new
            {
                LastFour = cc.LastFourDigits,
                Expiry = $"{cc.ExpiryMonth}/{cc.ExpiryYear}"
            },
            PayPalAccount pp => new
            {
                Email = pp.Email,
                Verified = pp.IsVerified
            },
            _ => new { Type = "Unknown" }
        };
    }
}
```

### 7.4 Expression Tree Transformation

Advanced LINQ integration with expression tree transformation for filtering and sorting:

```csharp
// Original predicate on domain entity
Expression<Func<User, bool>> domainPredicate = u => u.IsActive && u.Email.Contains("@company.com");

// Transform to work with DTO
Expression<Func<UserDto, bool>> dtoPredicate = domainPredicate.Transform<User, UserDto>();

// Use with projected collections
var filteredDtos = await dbContext.Users
    .SelectFacet<UserDto>()
    .Where(dtoPredicate)
    .ToListAsync();
```

### 7.5 Validation Integration

Integration with validation frameworks for automatic constraint propagation:

```csharp
public class User
{
    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; }

    [EmailAddress]
    public string Email { get; set; }

    [Range(18, 120)]
    public int Age { get; set; }
}

[Facet(typeof(User), PreserveValidationAttributes = true)]
public partial class UserDto
{
    // Validation attributes are automatically copied
    // [Required, MaxLength(100)] public string FirstName { get; set; }
    // [EmailAddress] public string Email { get; set; }
    // [Range(18, 120)] public int Age { get; set; }
}
```

## 8. Conclusion

### 8.1 Summary of Key Points

This analysis has demonstrated that Facet represents a significant advancement in .NET mapping and projection technology. Through compile-time code generation, it addresses fundamental limitations of existing solutions while providing superior developer experience.

#### Key Takeaways:

- **Compile-Time Generation:** Facet achieves zero runtime overhead while eliminating boilerplate code
- **Type Safety:** Compile-time guarantees eliminate entire categories of runtime errors
- **Integration:** Seamless integration with modern .NET frameworks and patterns
- **Flexibility:** Support for synchronous, asynchronous, and hybrid mapping strategies
- **Maintainability:** Significant reduction in maintenance overhead compared to manual approaches

### 8.2 Architectural Implications

The adoption of facetting as a design pattern has broader implications for software architecture:

#### 8.2.1 Microservices Architecture

Facet's efficient projection capabilities support microservices patterns by enabling fine-grained data contracts without performance penalties. The compile-time generation ensures that service boundaries remain clean and efficient.

#### 8.2.2 Domain-Driven Design

The clear separation between domain models and their projections reinforces DDD principles. Facets serve as anti-corruption layers, protecting domain integrity while enabling diverse presentation needs.

#### 8.2.3 Clean Architecture

Facet supports Clean Architecture by facilitating efficient boundary crossing between layers. The generated mappers provide the necessary abstraction without violating dependency inversion principles.

### 8.3 Recommendations for Adoption

#### 8.3.1 Immediate Adoption Scenarios

Teams should consider immediate Facet adoption for:

- New .NET 8+ projects with significant DTO requirements
- Entity Framework Core heavy applications
- APIs with multiple client types requiring different data shapes
- Projects prioritizing maintainability and compile-time safety

#### 8.3.2 Gradual Migration Strategy

For existing applications, a gradual migration approach is recommended:

1. **Pilot Phase:** Implement Facet for new features and high-traffic endpoints
2. **Feature Completion:** Gradually expand Facet usage as features are enhanced
3. **Legacy Replacement:** Replace remaining manual mapping as technical debt allows

### 8.4 Final Thoughts

Facet demonstrates that modern development tools can achieve both developer productivity and optimal compile-time safety. Through careful design and leveraging of platform capabilities, it provides a blueprint for future innovations in the .NET ecosystem.

The techniques explored in this analysis - compile-time generation, incremental compilation, type-safe projections, and async mapping patterns - represent best practices that extend beyond Facet itself. As software systems continue to grow in complexity, tools like Facet become increasingly essential for maintaining developer productivity while meeting demanding requirements.

#### Getting Started

To start using Facet in your projects:

- Visit the [GitHub repository](https://github.com/Tim-Maes/Facet) for documentation and examples
- Install the NuGet package: `dotnet add package Facet`
- Check out the sample projects for real-world usage patterns
- Join the community discussions for support and feature requests

---

*Want to learn more about source generators and code generation? Check out my other posts on .NET development!*
