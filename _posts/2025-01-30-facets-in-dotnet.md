---
layout: post
title: "Facetting in .NET"
date: 2025-01-30 14:00:00 +0000
tags: [source-generators, architecture, mapping, dtos, linq, csharp, dotnet]
---

> **Disclaimer:** Facet is a fairly new library, and some things referenced in this article may be inaccurate because Facet might have had updates or changes since this was written. Please refer to the official documentation for the most current information.

## Facets in .NET

> "One part of an object, situation, or subject that has many parts."

This post presents a comprehensive analysis of Facet, a C# source generator designed to address the proliferation of boilerplate code in modern .NET applications through compile-time projection generation. I address the theoretical foundations of facetting as a software engineering concept, analyze the implementation architecture, and demonstrate how to leverage this approach in real-world applications.

<div style="text-align: center; margin: 2rem 0;">
  <img src="https://raw.githubusercontent.com/Tim-Maes/Facet/master/assets/Facet.png" alt="Facet logo" style="max-width: 100%; width: 600px; border-radius: 6px;">
</div>

## Introduction

In contemporary .NET development, the Data Transfer Object (DTO) pattern has become ubiquitous for creating boundaries between application layers, API contracts, and external integrations. However, this pattern often leads to significant code duplication, maintenance overhead, and potential for mapping errors.

Facet addresses these challenges through compile-time code generation, implementing what we term "facetting" - the process of creating lightweight, focused projections of richer domain models. This approach eliminates boilerplate while maintaining strong typing, compile-time safety, and zero runtime overhead.

## Quick Start: See It In Action

Before diving into the theory, let's see what Facet looks like in practice.

### Basic Projection - Exclude Mode

```csharp
// Your domain model
public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Exclude sensitive properties
[Facet(typeof(User), exclude: nameof(User.PasswordHash))]
public partial class UserDto { }

// Usage
var userDto = user.ToFacet<User, UserDto>();
var users = dbContext.Users
    .SelectFacet<User, UserDto>()
    .ToListAsync();
```

### Focused Projection - Include Mode

```csharp
// Only include specific properties for a contact card
[Facet(typeof(User), Include = new[] { "FirstName", "LastName", "Email" })]
public partial class UserContactDto { }

// Only include name for a simple dropdown
[Facet(typeof(User), Include = new[] { "Id", "FirstName", "LastName" })]
public partial class UserNameDto { }

// Usage
var contactInfo = user.ToFacet<User, UserContactDto>();
var dropdownItems = await dbContext.Users
    .SelectFacet<User, UserNameDto>()
    .ToListAsync();
```

### Bidirectional Mapping

```csharp
// Create a DTO
[Facet(typeof(User), Include = new[] { "FirstName", "LastName", "Email" })]
public partial class UpdateUserDto { }

// Map to DTO
var dto = user.ToFacet<User, UpdateUserDto>();

// Map back to entity (with smart defaults for missing properties)
var updatedUser = dto.BackTo<UpdateUserDto, User>();

// Or update existing entity efficiently
user.UpdateFromFacet(dto, dbContext);
```

### Custom Computed Properties

```csharp
// Define custom mapping logic
public class UserMapper : IFacetMapConfiguration<User, UserSummaryDto>
{
    public static void Map(User source, UserSummaryDto target)
    {
        target.FullName = $"{source.FirstName} {source.LastName}";
        target.MemberSince = $"Member since {source.CreatedAt:MMMM yyyy}";
    }
}

// Apply the mapper
[Facet(typeof(User), Configuration = typeof(UserMapper))]
public partial class UserSummaryDto
{
    public string FullName { get; set; }
    public string MemberSince { get; set; }
}

// Usage
var summary = user.ToFacet<User, UserSummaryDto>();
```

### Auto-Generate CRUD DTOs

```csharp
// Generate all standard CRUD DTOs at once
[GenerateDtos(Types = DtoTypes.All)]
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Auto-generates:
// - CreateProductRequest (excludes Id, CreatedAt)
// - UpdateProductRequest (includes Id, excludes CreatedAt)
// - ProductResponse (includes everything)
// - ProductQuery (all properties nullable for filtering)
// - UpsertProductRequest (includes Id for create/update)
```

## The Problem with Traditional Mapping

### Manual Mapping

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

### Maintenance Overhead

In a typical enterprise application with 50 domain entities requiring an average of 4 projections each:

- **Manual mapping:** 200 DTO classes + 200 mapper classes = 400 files to maintain
- **Facet:** 200 DTO declarations (partial classes) = 200 files, minimal maintenance

## Entity Framework Core Integration

Facet provides comprehensive Entity Framework Core integration:

### Query Projections

```csharp
// Basic projection
var userDtos = await dbContext.Users
    .Where(u => u.IsActive)
    .SelectFacet<UserDto>()
    .ToListAsync();

// Projection with includes
var orderDtos = await dbContext.Orders
    .Include(o => o.Customer)
    .Include(o => o.Items)
    .SelectFacet<OrderDto>()
    .ToListAsync();

// Projection with custom filtering
var recentUserDtos = await dbContext.Users
    .Where(u => u.CreatedAt > DateTime.UtcNow.AddDays(-30))
    .SelectFacet<UserDto>()
    .OrderBy(dto => dto.LastName)
    .ToListAsync();
```

### Update Operations

```csharp
// Efficient updates using facets
[HttpPut("{id}")]
public async Task<IActionResult> UpdateUser(int id, UserUpdateDto dto)
{
    var user = await dbContext.Users.FindAsync(id);
    if (user == null) return NotFound();
    
    // Only modified properties are tracked for changes
    user.UpdateFromFacet(dto, dbContext);
    
    await dbContext.SaveChangesAsync();
    return NoContent();
}
```

## ASP.NET Core Integration

Seamless integration with ASP.NET Core controllers and minimal APIs:

```csharp
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetUsers(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 20)
    {
        var users = await _context.Users
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .SelectFacet<UserDto>()
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser(CreateUserDto dto)
    {
        var user = dto.ToEntity<User>();
        
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var responseDto = user.ToFacet<UserDto>();
        return CreatedAtAction(nameof(GetUser), new { id = user.Id }, responseDto);
    }
}
```

## Conclusion

Facet transforms dependency injection in .NET applications from a configuration chore into an elegant, declarative system. Through compile-time code generation, it addresses fundamental limitations of existing solutions while providing superior developer experience.

### Key Takeaways

- **Compile-Time Generation:** Facet achieves zero runtime overhead while eliminating boilerplate code
- **Type Safety:** Compile-time guarantees eliminate entire categories of runtime errors
- **Integration:** Seamless integration with modern .NET frameworks and patterns
- **Flexibility:** Support for synchronous, asynchronous, and hybrid mapping strategies
- **Maintainability:** Significant reduction in maintenance overhead compared to manual approaches

## Resources

- **Facet on GitHub:** [https://github.com/Tim-Maes/Facet](https://github.com/Tim-Maes/Facet)
- **Facet on NuGet:** [https://www.nuget.org/packages/Facet](https://www.nuget.org/packages/Facet)

---

*Want to learn more about source generators and code generation? Check out my other posts on .NET development!*
