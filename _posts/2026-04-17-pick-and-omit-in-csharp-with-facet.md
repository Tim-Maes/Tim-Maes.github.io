---
layout: post
title: "Pick and Omit in C# with Facet .NET: TypeScript Utility Types for .NET"
date: 2026-04-17 16:00:00 +0000
tags: [csharp, dotnet, typescript, source-generators, facet, utilities, types]
excerpt: "If you’ve worked with TypeScript, you know how powerful utility types like Pick<T, K> and Omit<T, K> are. They let you create new types by selecting or excluding properties from existing types, all at compile-time with full type safety."
---

<div style="text-align: center; margin: 2rem 0;">
  <a href="https://www.github.com/Tim-Maes/Facet" target="_blank">
    <img src="https://github.com/Tim-Maes/Facet/blob/master/assets/Facet.png?raw=true" alt="Facet Logo" style="max-width: 100%; width: 600px; height: auto; display: block; margin: 0 auto; border-radius: 8px;" />
  </a>
</div>

If you've worked with TypeScript, you know how powerful utility types like `Pick<T, K>` and `Omit<T, K>` are. They let you create new types by selecting or excluding properties from existing types, all at compile-time with full type safety.

**What if you could do the same in C#?**

With [Facet](https://github.com/Tim-Maes/Facet), you can! Let me show you how C# developers can enjoy the same convenience that TypeScript developers have been enjoying for years.

## TypeScript's Pick and Omit: A Quick Refresher

In TypeScript, utility types let you transform types declaratively:

```typescript
// Original type
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  salary: number;
  isActive: boolean;
  createdAt: Date;
}

// Pick - Select only specific properties
type UserPublicProfile = Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
// Result: { id, firstName, lastName, email }

// Omit - Exclude specific properties
type UserSafeDto = Omit<User, 'passwordHash' | 'salary'>;
// Result: All properties except passwordHash and salary
```

These are **compile-time transformations**: no runtime overhead, full IntelliSense support, and type safety guaranteed.

### Why Pick and Omit Are So Useful

1. **API Responses** - Hide sensitive fields
2. **Form Models** - Only include editable fields
3. **Search Filters** - Pick filterable properties
4. **Database Projections** - Select only needed columns
5. **Type Narrowing** - Create focused interfaces

## The C# issue: manual DTOs

C# developers have been writing this pattern for years:

```csharp
// Domain model
public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }  // Sensitive!
    public decimal Salary { get; set; }       // Sensitive!
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Manual "Pick": only specific properties
public class UserPublicProfile
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
}

// Manual "Omit": everything except sensitive fields
public class UserSafeDto
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    // passwordHash and salary excluded
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

**This is painful:**
- Repetitive property declarations
- No compile-time link to source type
- Easy to get out of sync
- Tedious to maintain

## Facet: Pick and Omit for C#

Facet brings TypeScript-style utility types to C# using source generators:

```csharp
// Install Facet
// dotnet add package Facet

// Domain model (same as before)
public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public decimal Salary { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Pick - Include only specific properties
[Facet(typeof(User), Include = ["Id", "FirstName", "LastName", "Email"])]
public partial record UserPublicProfile;

// Omit - Exclude specific properties
[Facet(typeof(User), "PasswordHash", "Salary")]
public partial record UserSafeDto;
```

That's it! Facet generates the complete DTOs at compile-time with:
- All specified properties
- Constructors for mapping
- LINQ projection expressions
- Full type safety
- IntelliSense support

## Side-by-Side Comparison

### Pick Example

**TypeScript:**
```typescript
type UserContactInfo = Pick<User, 'firstName' | 'lastName' | 'email'>;
```

**C# with Facet:**
```csharp
[Facet(typeof(User), Include = ["FirstName", "LastName", "Email"])]
public partial record UserContactInfo;
```

### Omit Example

**TypeScript:**
```typescript
type UserPublic = Omit<User, 'passwordHash' | 'salary'>;
```

**C# with Facet:**
```csharp
[Facet(typeof(User), "PasswordHash", "Salary")]
public partial record UserPublic;
```

## But Facet Goes Further Than TypeScript

While TypeScript's Pick and Omit only create type definitions, **Facet generates actual runtime code** with additional features:

### 1. Automatic Mapping

```csharp
[Facet(typeof(User), Include = ["FirstName", "LastName", "Email"])]
public partial record UserContactInfo;

// Use it immediately
User user = GetUser();
var contact = new UserContactInfo(user);  // Constructor generated!

// Or use extension methods
var contact = user.ToFacet<User, UserContactInfo>();
```

**TypeScript doesn't generate constructors or mapping logic**, you still write that manually.

### 2. LINQ Projections for EF Core

```csharp
[Facet(typeof(User), Include = ["Id", "FirstName", "LastName"])]
public partial record UserListItem;

// Optimal SQL query - only selects needed columns!
var users = await dbContext.Users
    .Where(u => u.IsActive)
    .SelectFacet<UserListItem>()
    .ToListAsync();

// Generated SQL:
// SELECT u.Id, u.FirstName, u.LastName
// FROM Users u
// WHERE u.IsActive = 1
```

**TypeScript can't optimize database queries**, it's a compile-time-only language.

### 3. Nested Object Support

```csharp
public class Order
{
    public int Id { get; set; }
    public DateTime OrderDate { get; set; }
    public User Customer { get; set; }
    public Address ShippingAddress { get; set; }
}

[Facet(typeof(Address), Include = ["Street", "City", "ZipCode"])]
public partial record AddressDto;

[Facet(typeof(User), Include = ["FirstName", "LastName", "Email"])]
public partial record UserDto;

// Pick properties from Order AND nested types
[Facet(typeof(Order),
    Include = ["Id", "OrderDate", "Customer", "ShippingAddress"],
    NestedFacets = [typeof(UserDto), typeof(AddressDto)])]
public partial record OrderSummary;

var order = GetOrder();
var summary = new OrderSummary(order);
// summary.Customer is UserDto (picked properties)
// summary.ShippingAddress is AddressDto (picked properties)
```

### 4. Reverse Mapping (ToSource)

```csharp
[Facet(typeof(User),
    Include = ["FirstName", "LastName", "Email"],
    GenerateToSource = true)]
public partial record UserUpdateRequest;

var request = new UserUpdateRequest
{
    FirstName = "John",
    LastName = "Doe",
    Email = "john@example.com"
};

var user = request.ToSource();  // Maps back to User entity!
```

### 5. Property Renaming with MapFrom

```csharp
[Facet(typeof(User), Include = ["FirstName", "Email"])]
public partial record UserDto
{
    // Pick FirstName but rename it to Name
    [MapFrom(nameof(User.FirstName))]
    public string Name { get; set; } = string.Empty;
}

var dto = new UserDto(user);
// dto.Name = user.FirstName
```

### 6. Conditional Inclusion with MapWhen

```csharp
public class Order
{
    public int Id { get; set; }
    public OrderStatus Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? TrackingNumber { get; set; }
}

[Facet(typeof(Order), Include = ["Id", "Status", "CompletedAt", "TrackingNumber"])]
public partial record OrderDto
{
    // Only include CompletedAt if order is completed
    [MapWhen("Status == OrderStatus.Completed")]
    public DateTime? CompletedAt { get; set; }

    // Only include tracking if not cancelled
    [MapWhen("Status != OrderStatus.Cancelled")]
    public string? TrackingNumber { get; set; }
}
```

## Advanced: TypeScript's Utility Types in C#

Facet enables even more TypeScript-style patterns:

### Readonly (with Wrapper)

**TypeScript:**
```typescript
type ReadonlyUser = Readonly<User>;
```

**C# with Facet:**
```csharp
[Wrapper(typeof(User), ReadOnly = true)]
public partial class ReadonlyUser;
```

### Partial (with NullableProperties)

**TypeScript:**
```typescript
type PartialUser = Partial<User>;
```

**C# with Facet:**
```csharp
[Facet(typeof(User), NullableProperties = true)]
public partial record PartialUser;
```

### Record (with structs)

**TypeScript:**
```typescript
type UserRecord = Readonly<User>;
```

**C# with Facet:**
```csharp
[Facet(typeof(User))]
public partial record struct UserRecord;
```

## Performance: Zero Runtime Overhead

Just like TypeScript's utility types, Facet operates **entirely at compile-time**:

- ✅ Source code generated during compilation
- ✅ No reflection at runtime
- ✅ No performance penalty
- ✅ Same speed as hand-written code
- ✅ Optimal SQL for EF Core queries

## Getting Started

```bash
# Install Facet
dotnet add package Facet
dotnet add package Facet.Extensions
dotnet add package Facet.Extensions.EFCore

# Start using Pick and Omit!
```

**Basic usage:**

```csharp
using Facet;

// Your domain model
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public string InternalCode { get; set; }
}

// Pick - Include only
[Facet(typeof(Product), Include = ["Id", "Name", "Price"])]
public partial record ProductDto;

// Omit - Exclude
[Facet(typeof(Product), "InternalCode")]
public partial record ProductPublicDto;

// Use it
var product = new Product { /* ... */ };
var dto = product.ToFacet<Product, ProductDto>();
```

## Conclusion

If you love TypeScript's `Pick` and `Omit` utility types, you'll love Facet. It brings the same **declarative, type-safe approach** to C#, but with additional runtime benefits:

- ✅ **Compile-time generation** (like TypeScript)
- ✅ **Runtime mapping code** (better than TypeScript)
- ✅ **EF Core LINQ projections** (impossible in TypeScript)
- ✅ **Nested object handling** (more powerful than TypeScript)
- ✅ **Zero performance overhead** (like TypeScript)
- ✅ **Full IntelliSense support** (like TypeScript)

**Stop writing repetitive DTOs. Start using Facet.**

---

**Resources:**
- [GitHub Repository](https://github.com/Tim-Maes/Facet)
- [Documentation](https://github.com/Tim-Maes/Facet/wiki)
- [NuGet Package](https://www.nuget.org/packages/Facet)
- [Discord Community](https://discord.gg/yGDBhGuNMB)

**Previous posts:**
- [Facets in .NET]({% post_url 2025-09-28-facets-in-dotnet (2) %})
