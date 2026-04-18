---
layout: post
title: "Facets in .NET"
date: 2025-09-28 14:00:00 +0000
tags: [source-generators, architecture, mapping, dtos, linq, csharp, dotnet, efcore]
---

<div style="text-align: center; margin: 2rem 0;">
  <a href="https://www.github.com/Tim-Maes/Facet" target="_blank">
    <img src="https://github.com/Tim-Maes/Facet/blob/master/assets/Facet.png?raw=true" alt="Facet Logo" style="max-width: 100%; width: 600px; height: auto; display: block; margin: 0 auto; border-radius: 8px;" />
  </a>
</div>

## The Problem with Traditional DTOs

If you've worked with modern C# applications, you've written this pattern countless times:

```csharp
public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }  // Sensitive!
    public decimal Salary { get; set; }       // Sensitive!
}

// Manual DTO definition
public class UserDto
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
}

// Manual mapper
public static UserDto ToDto(this User user) => new()
{
    Id = user.Id,
    FirstName = user.FirstName,
    LastName = user.LastName,
    Email = user.Email
};
```

This is **repetitive, error-prone, and becomes a maintenance nightmare**. Add a property to `User`? Update every DTO, mapper, and LINQ projection. Miss one? Runtime bug.

## What is Facetting?

Think of a diamond. The whole stone is your domain model—it contains everything. But when you view it from different angles, you see different **facets**: specific views that show only what matters from that perspective.

> **Facet** - "One part of an object, situation, or subject that has many parts."

In software terms, **facetting** is defining focused, compile-time views of your domain models. Instead of manually creating DTOs, you **declare what you want**, and Facet generates everything at compile-time.

### Key Benefits

- **Zero runtime cost** - Everything generated at compile time
- **Type-safe** - Compiler errors if properties don't exist
- **No reflection** - Pure C# code generation
- **Automatic maintenance** - Change domain model, facets update automatically
- **Works everywhere** - LINQ, Entity Framework Core, APIs

## Getting Started

```bash
dotnet add package Facet
dotnet add package Facet.Extensions        # For LINQ helpers
dotnet add package Facet.Extensions.EFCore # For EF Core integration
```

## Basic Usage

```csharp
// Define a facet - exclude sensitive properties
[Facet(typeof(User), nameof(User.PasswordHash), nameof(User.Salary))]
public partial record UserPublicDto;

// That's it! Facet generates:
// - All properties except PasswordHash and Salary
// - Constructor from User
// - LINQ projection expression
// - Mapping methods
```

Using it:

```csharp
// Single object
User user = GetUser();
var dto = user.ToFacet<User, UserPublicDto>();

// Collection
List<User> users = GetUsers();
var dtos = users.SelectFacets<User, UserPublicDto>();

// EF Core - automatic SQL projection!
var dtos = await dbContext.Users
    .Where(u => u.IsActive)
    .SelectFacet<UserPublicDto>()
    .ToListAsync();
```

## Include vs Exclude Patterns

**Exclude** (when you want most properties):

```csharp
[Facet(typeof(User), "PasswordHash", "Salary", "InternalNotes")]
public partial record UserApiDto;
```

**Include** (when you want specific properties):

```csharp
[Facet(typeof(User), Include = ["FirstName", "LastName", "Email"])]
public partial record UserContactDto;
```

## Property Renaming with [MapFrom]

**V6 Feature:** Rename properties declaratively:

```csharp
[Facet(typeof(User), GenerateToSource = true)]
public partial class UserDto
{
    // Rename FirstName to Name
    [MapFrom(nameof(User.FirstName), Reversible = true)]
    public string Name { get; set; } = string.Empty;

    // Computed expression
    [MapFrom(nameof(User.FirstName) + " + \" \" + " + nameof(User.LastName))]
    public string FullName { get; set; } = string.Empty;
}

var dto = new UserDto(user);
// dto.Name = "John" (from FirstName)
// dto.FullName = "John Doe" (computed)

// Reverse mapping works!
var entity = dto.ToSource();
// entity.FirstName = dto.Name
```

**Nested property paths:**

```csharp
[Facet(typeof(Employee), exclude: [nameof(Employee.Company)])]
public partial class EmployeeDto
{
    [MapFrom("Company.Name")]
    public string CompanyName { get; set; } = string.Empty;

    [MapFrom("Company.Address.City")]
    public string CompanyCity { get; set; } = string.Empty;
}
```

## Conditional Mapping with [MapWhen]

**V6 Feature:** Map properties only when conditions are met:

```csharp
public class Order
{
    public OrderStatus Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? TrackingNumber { get; set; }
}

[Facet(typeof(Order))]
public partial class OrderDto
{
    // Only map when completed
    [MapWhen("Status == OrderStatus.Completed")]
    public DateTime? CompletedAt { get; set; }

    // Multiple conditions (AND logic)
    [MapWhen("IsActive")]
    [MapWhen("Status != OrderStatus.Cancelled")]
    public string? TrackingNumber { get; set; }
}
```

**Works in EF Core projections!** The conditions are translated to SQL.

## Multi-Source Mapping

**V6.2 Feature:** One DTO can map from multiple source types:

```csharp
[Facet(typeof(UserEntity))]
[Facet(typeof(AdminEntity))]
public partial class UserDto
{
    // Properties are the union of both sources
}

// Generates:
// - new UserDto(UserEntity source)
// - new UserDto(AdminEntity source)
// - ProjectionFromUserEntity
// - ProjectionFromAdminEntity
// - ToUserEntity()
// - ToAdminEntity()
```

## Enum Conversion

**V6 Feature:** Convert enums to string or int with full round-trip:

```csharp
// Convert to strings
[Facet(typeof(User), ConvertEnumsTo = typeof(string), GenerateToSource = true)]
public partial class UserStringDto;

var dto = new UserStringDto(user);
// dto.Status = "Active" (string, not UserStatus enum)

var entity = dto.ToSource();
// entity.Status = UserStatus.Active (enum)

// Works in projections too!
var dtos = await dbContext.Users
    .Select(UserStringDto.Projection)
    .ToListAsync();
```

## Collection Type Remapping

**V6 Feature:** Convert EF Core's `Collection<T>` to `List<T>`:

```csharp
[Facet(typeof(Order),
    CollectionTargetType = typeof(List<>),
    NestedFacets = [typeof(OrderItemDto)])]
public partial class OrderDto;

// Collection<OrderItem> → List<OrderItemDto>
// ToSource() restores Collection<OrderItem>
```

## Nested Facets

Handle complex object graphs elegantly:

```csharp
// Bottom-up approach
[Facet(typeof(Address))]
public partial record AddressDto;

[Facet(typeof(Company), NestedFacets = [typeof(AddressDto)])]
public partial record CompanyDto;

[Facet(typeof(Employee),
    exclude: ["PasswordHash", "Salary"],
    NestedFacets = [typeof(CompanyDto), typeof(AddressDto)])]
public partial record EmployeeDto;

// Collections work automatically!
public class Order
{
    public List<OrderItem> Items { get; set; }
    public Address ShippingAddress { get; set; }
}

[Facet(typeof(OrderItem))]
public partial record OrderItemDto;

[Facet(typeof(Order), NestedFacets = [typeof(OrderItemDto), typeof(AddressDto)])]
public partial record OrderDto;
// List<OrderItem> automatically becomes List<OrderItemDto>!
```

## EF Core Integration

### Automatic Navigation Loading

**No `.Include()` needed!**

```csharp
// WITHOUT Facet
var employees = await dbContext.Employees
    .Include(e => e.Company)
        .ThenInclude(c => c.Headquarters)
    .Include(e => e.HomeAddress)
    .Select(e => new EmployeeDto { ... })
    .ToListAsync();

// WITH Facet - automatic!
var employees = await dbContext.Employees
    .SelectFacet<EmployeeDto>()
    .ToListAsync();
// Facet generates proper JOINs automatically!
```

### Patch Updates

```csharp
[HttpPut("employees/{id}")]
public async Task<IActionResult> UpdateEmployee(int id, EmployeeUpdateDto dto)
{
    var employee = await dbContext.Employees.FindAsync(id);
    if (employee == null) return NotFound();

    // Updates only changed properties
    employee.ApplyFacet(dto, dbContext);

    await dbContext.SaveChangesAsync();
    return NoContent();
}

// With change tracking
var result = employee.ApplyFacetWithChanges(dto, dbContext);
if (result.HasChanges)
{
    logger.LogInformation(
        "Employee {Id} updated. Changed: {Properties}",
        employee.Id,
        string.Join(", ", result.ChangedProperties));
}
```

## Custom Mapping

### Synchronous Mapping

```csharp
public class UserMapper : IFacetMapConfiguration<User, UserDetailDto>
{
    public static void Map(User source, UserDetailDto target)
    {
        target.FullName = $"{source.FirstName} {source.LastName}";
        target.Age = CalculateAge(source.DateOfBirth);
        target.MembershipLevel = source.CreatedAt < DateTime.Now.AddYears(-5)
            ? "Gold" : "Silver";
    }

    private static int CalculateAge(DateTime birthDate)
    {
        var today = DateTime.Today;
        var age = today.Year - birthDate.Year;
        if (birthDate.Date > today.AddYears(-age)) age--;
        return age;
    }
}

[Facet(typeof(User),
    exclude: ["PasswordHash", "Salary"],
    Configuration = typeof(UserMapper))]
public partial record UserDetailDto
{
    public string FullName { get; set; } = string.Empty;
    public int Age { get; set; }
    public string MembershipLevel { get; set; } = string.Empty;
}
```

### Async Mapping with DI

```csharp
public class UserEnrichedMapper : IFacetMapConfigurationAsyncInstance<User, UserEnrichedDto>
{
    private readonly IProfileService _profileService;

    public UserEnrichedMapper(IProfileService profileService)
    {
        _profileService = profileService;
    }

    public async Task MapAsync(
        User source,
        UserEnrichedDto target,
        CancellationToken cancellationToken = default)
    {
        target.ProfileUrl = await _profileService
            .GetProfileUrlAsync(source.Id, cancellationToken);
    }
}

// Usage
var mapper = serviceProvider.GetRequiredService<UserEnrichedMapper>();
var dto = await user.ToFacetAsync(mapper);
```

### Mapping Hooks

**V6 Feature:** Before/After hooks for validation and computed values:

```csharp
public class UserBeforeMap : IFacetBeforeMapConfiguration<User, UserDto>
{
    public static void BeforeMap(User source, UserDto target)
    {
        if (string.IsNullOrEmpty(source.Email))
            throw new ValidationException("Email required");
        target.MappedAt = DateTime.UtcNow;
    }
}

public class UserAfterMap : IFacetAfterMapConfiguration<User, UserDto>
{
    public static void AfterMap(User source, UserDto target)
    {
        target.FullName = $"{target.FirstName} {target.LastName}";
    }
}

[Facet(typeof(User),
    BeforeMapConfiguration = typeof(UserBeforeMap),
    AfterMapConfiguration = typeof(UserAfterMap))]
public partial class UserDto
{
    public DateTime MappedAt { get; set; }
    public string FullName { get; set; } = string.Empty;
}
```

## Advanced Features

### Flatten Nested Objects

```csharp
public class Person
{
    public string FirstName { get; set; }
    public Address Address { get; set; }
}

public class Address
{
    public string Street { get; set; }
    public Country Country { get; set; }
}

[Flatten(typeof(Person))]
public partial class PersonFlatDto;

var dto = new PersonFlatDto(person);
// Generated properties:
// - FirstName
// - AddressStreet
// - AddressCountryName
// - AddressCountryCode
```

### Wrapper (Reference-Based Delegation)

```csharp
[Wrapper(typeof(User), nameof(User.Password), nameof(User.Salary))]
public partial class PublicUserWrapper;

var user = new User { FirstName = "John", Password = "secret" };
var wrapper = new PublicUserWrapper(user);

wrapper.FirstName = "Jane";
// user.FirstName is now "Jane" (changes propagate!)

// Read-only wrappers
[Wrapper(typeof(Product), ReadOnly = true)]
public partial class ReadOnlyProductView;
```

### Auto-Generate CRUD DTOs

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
// - UpsertProductRequest
```

### Global Configuration Defaults

**V6 Feature:** Set defaults project-wide:

```xml
<!-- .csproj or Facet.props -->
<PropertyGroup>
  <FacetGenerateProjection>true</FacetGenerateProjection>
  <FacetGenerateToSource>true</FacetGenerateToSource>
  <FacetNullableProperties>false</FacetNullableProperties>
</PropertyGroup>
```

### Source Signature Tracking

**V6 Feature:** Detect breaking changes:

```csharp
[Facet(typeof(User), SourceSignature = "a1b2c3d4")]
public partial class UserDto;

// When User structure changes:
// warning FAC022: Source entity 'User' structure has changed.
// Update SourceSignature to 'e5f6g7h8' to acknowledge this change.
```

IDE provides code fix to auto-update!

### Nullable Properties for Filters

```csharp
[Facet(typeof(User),
    Include = ["FirstName", "LastName", "Email", "IsActive"],
    NullableProperties = true,
    GenerateToSource = false)]
public partial record UserFilterDto;

// All properties nullable - perfect for query params!
public async Task<List<UserDto>> SearchUsers(UserFilterDto filter)
{
    var query = dbContext.Users.AsQueryable();

    if (filter.FirstName != null)
        query = query.Where(u => u.FirstName.Contains(filter.FirstName));

    if (filter.IsActive.HasValue)
        query = query.Where(u => u.IsActive == filter.IsActive.Value);

    return await query.SelectFacet<UserDto>().ToListAsync();
}
```

### Copy Constructors & Equality

**V6 Feature:**

```csharp
[Facet(typeof(User),
    GenerateCopyConstructor = true,
    GenerateEquality = true)]
public partial class UserDto;

var original = new UserDto(user);
var copy = new UserDto(original);  // Clone

copy.Name = "Changed";
// original.Name unchanged

// Value equality
var dto1 = new UserDto(user);
var dto2 = new UserDto(user);
dto1 == dto2;  // true (value-based)
```

## Performance

Facet is built for performance:

- **Compile-time generation** - Zero runtime overhead
- **No reflection** - Pure C# code
- **Optimal SQL** - Only fetches needed columns
- **Competitive benchmarks** - As fast as hand-written code

**Benchmark Results:**

| Method | Mean (ns) | Ratio | Allocated |
|--------|-----------|-------|-----------|
| Facet | 5.922 | baseline | 40 B |
| Mapperly | 6.227 | 1.05x slower | 40 B |
| Mapster | 13.243 | 2.24x slower | 40 B |
| AutoMapper | 31.459 | 5.31x slower | 40 B |

## Best Practices

### 1. Meaningful Names

```csharp
// ❌ Generic
public partial record UserDto;

// ✅ Descriptive
public partial record UserPublicProfile;
public partial record UserAdminView;
public partial record UserSearchResult;
```

### 2. Bottom-Up Approach

```csharp
// ✅ Correct order
[Facet(typeof(Address))]              // No dependencies
public partial record AddressDto;

[Facet(typeof(Company), NestedFacets = [typeof(AddressDto)])]
public partial record CompanyDto;

[Facet(typeof(Employee), NestedFacets = [typeof(CompanyDto), typeof(AddressDto)])]
public partial record EmployeeDto;
```

### 3. Use Exclude for APIs, Include for Specific Cases

```csharp
// ✅ Public APIs - hide sensitive
[Facet(typeof(User), "PasswordHash", "Salary", "SSN")]
public partial record UserPublicApi;

// ✅ Specific features - only what's needed
[Facet(typeof(User), Include = ["Id", "FirstName", "LastName"])]
public partial record UserAutocomplete;
```

### 4. Keep Mappers Focused

```csharp
// ✅ Good - presentation logic
public static void Map(User source, UserDto target)
{
    target.FullName = $"{source.FirstName} {source.LastName}";
    target.DisplayAge = $"{CalculateAge(source.DateOfBirth)} years old";
}

// ❌ Bad - business logic belongs in domain
public static void Map(User source, UserDto target)
{
    target.CanPurchase = source.Age >= 18; // Business logic!
}
```

## Circular References

Use `MaxDepth` and `PreserveReferences`:

```csharp
public class Author
{
    public List<Book> Books { get; set; }
}

public class Book
{
    public Author Author { get; set; }  // Circular!
}

[Facet(typeof(Author), MaxDepth = 2, NestedFacets = [typeof(BookDto)])]
public partial record AuthorDto;

[Facet(typeof(Book), MaxDepth = 2, NestedFacets = [typeof(AuthorDto)])]
public partial record BookDto;
```

## Getting Started

```bash
# Install packages
dotnet add package Facet
dotnet add package Facet.Extensions
dotnet add package Facet.Extensions.EFCore

# Check out the samples
git clone https://github.com/Tim-Maes/Facet
```

**Resources:**
- [GitHub Repository](https://github.com/Tim-Maes/Facet)
- [Documentation & Wiki](https://github.com/Tim-Maes/Facet/wiki)
- [NuGet Package](https://www.nuget.org/packages/Facet)
- [Discord Community](https://discord.gg/yGDBhGuNMB)

## Conclusion

Facet eliminates DTO boilerplate while maintaining compile-time safety and zero runtime overhead. With V6's new features like `MapFrom`, `MapWhen`, multi-source mapping, and enum conversion, it's more powerful than ever.

Whether you're building microservices, clean architecture applications, or complex domain models, Facet helps you focus on business logic instead of plumbing code.

**Try it today and reclaim your productivity!**

---

*Questions? Found this helpful? Let me know in the comments or join the [Discord community](https://discord.gg/yGDBhGuNMB)!*
