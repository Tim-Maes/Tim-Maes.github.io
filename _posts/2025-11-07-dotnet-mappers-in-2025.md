---
layout: post
title: "Facet: A Source Generator Competing with Traditional Mapping Libraries"
date: 2025-11-07 14:00:00 +0000
categories: [dotnet, csharp, source-generators, dto]
tags: [facet, automapper, mapperly, mapster, object-mapping, source-generation]
---

## The Mapper Problem

For over a decade, .NET developers have been writing the same code three times:

```csharp
// 1. Define your domain model
public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string PasswordHash { get; set; }
    public decimal Salary { get; set; }
    public Address Address { get; set; }
}

// 2. Define your DTO (manually copying properties you need)
public class UserDto
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public AddressDto Address { get; set; }
    // Excluded: PasswordHash, Salary
}

// 3. Define mapping between them
public class UserMappingProfile : Profile
{
    public UserMappingProfile()
    {
        CreateMap<User, UserDto>();
        CreateMap<Address, AddressDto>();
    }
}
```

**Three files to maintain. Three places where changes propagate. Three opportunities for bugs.**

Traditional mapping libraries like AutoMapper, Mapster, and Mapperly have solved step #3 brilliantly. But they all assume you've already written steps #1 and #2.

**What if we could eliminate step #2 entirely?**

## Introducing Facet: Generate Everything at Compile Time

### What is Facetting?

Think of a **diamond**. The whole stone is your domain model - it contains everything about the entity. But when you view it from different angles, you see different **facets**: specific views that show only what matters from that perspective.

**Facet (noun):** *"One part of an object, situation, or subject that has many parts."*

In software terms, **facetting is the process of defining focused, compile-time views of your domain models**. Instead of manually creating DTOs and mappers, you declare what you want, and Facet generates everything at compile-time using C# source generators.

Facet is a .NET source generator that takes a fundamentally different approach: instead of mapping between DTOs you've already written, **Facet generates the DTOs for you** from your domain models.

Here's the same example with Facet:

```csharp
// 1. Define your domain model (same as before)
public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string PasswordHash { get; set; }
    public Address Address { get; set; }
}

// 2. Tell Facet what you don't want (exclusive)
[Facet(typeof(User), nameof(User.PasswordHash), NestedFacets = [typeof(AddressDto)])]
public partial record UserDto;

// Or tell Facet exactly what you do want (inclusive)
[Facet(typeof(User), 
    Include = [nameof(User.FirstName), nameof(User.LastName)],
    NestedFacets = [typeof(AddressDto)])]
public partial record UserInfoDto;

[Facet(typeof(Address))]
public partial record AddressDto;
```

That's it. **No step #3. No step #4.** Facet generates both the DTO class and the mapping logic at compile time.

## How Facet Competes with Traditional Mappers

Let's be clear about what Facet is now competing with: AutoMapper, Mapster, and Mapperly are the main players in .NET object mapping. AutoMapper (296M+ downloads) went commercial in April 2025. Mapster (7.4M downloads) has an uncertain development future. Mapperly is the rising star with active development and adoption by major frameworks like ABP.

Here's how Facet stacks up:

### The Fundamental Difference

| What You Write | AutoMapper | Mapster | Mapperly | **Facet** |
|----------------|-----------|---------|----------|-----------|
| Domain Model | You | You | You | You |
| DTO Classes | You | You | You | Generated |
| Mapper Config | You (Profile) | You (optional) | You (partial class) | Generated |
| **Lines of Code** | ~50+ | ~30+ | ~40+ | **~3** |

Facet eliminates 85-95% of the boilerplate by generating the DTO, mapping, **and handling EF includes automatically**.

### Feature Comparison: Where Facet Pulls Ahead

| Feature | AutoMapper | Mapster | Mapperly | **Facet** |
|---------|-----------|---------|----------|-----------|
| **DTO Generation** | Manual | Manual | Manual | **Automatic** |
| **Bidirectional Mapping** | Manual config | Auto | Manual methods | **Auto `ToSource()`** |
| **Nested Objects** | Manual config | Basic auto | Manual | **Auto with `NestedFacets`** |
| **Advanced Flattening** | Convention-based | Convention-based | Limited | **`[Flatten]` attribute** |
| **FK Clash Detection** | No | No | No | **Yes (unique)** |
| **EF Core Projections** | `ProjectTo<>()` | Yes | Manual | **Auto `SelectFacet<>()`** |
| **Property Renaming** | ForMember config | Config | Manual | **`[MapFrom]` attribute** |
| **Conditional Mapping** | Custom config | Custom config | Manual | **`[MapWhen]` attribute** |
| **Breaking Change Detection** | No | No | No | **`SourceSignature` (unique)** |
| **Generated Code Visibility** | Hidden | Optional | Full | **Full** |
| **License** | Commercial | MIT | Apache 2.0 | **MIT** |

## Deep Dive: What Makes Facet Different

### 1. Attribute-Based Configuration (Zero Boilerplate)

**Traditional Mapper (AutoMapper):**
```csharp
public class UserMappingProfile : Profile
{
    public UserMappingProfile()
    {
        CreateMap<User, UserDto>()
            .ForMember(d => d.FullName, opt => opt.MapFrom(s => $"{s.FirstName} {s.LastName}"))
            .ReverseMap();
        CreateMap<Address, AddressDto>();
    }
}
```

**Facet:**
```csharp
[Facet(typeof(User), NestedFacets = [typeof(AddressDto)])]
public partial record UserDto;
```

The DTO class, mapping logic, and nested object handling are all generated.

### 2. Automatic Bidirectional Mapping

**Traditional Mapper (Mapperly):**
```csharp
[Mapper]
public partial class UserMapper
{
    public partial UserDto ToDto(User user);        // Forward
    public partial User ToEntity(UserDto dto);      // Reverse - manual
}
```

**Facet:**
```csharp
// Enable bidirectional mapping
[Facet(typeof(User), GenerateToSource = true)]
public partial record UserDto;

// Usage
var dto = new UserDto(user);           // Forward mapping
var user = dto.ToSource();             // Reverse mapping (auto-generated)
```

Facet automatically generates bidirectional mapping when `GenerateToSource = true`. No need to define both directions.

### 3. Smart Nested Object Handling

**Traditional Mapper (Mapster):**
```csharp
// Works for simple cases, but complex nesting requires config
TypeAdapterConfig<User, UserDto>
    .NewConfig()
    .Map(dest => dest.Address, src => src.Address.Adapt<AddressDto>());
```

**Facet:**
```csharp
[Facet(typeof(User), NestedFacets = [typeof(AddressDto), typeof(ProjectDto)])]
public partial record UserDto;
```

Facet automatically detects and maps nested objects. Just declare which Facets to use for navigation properties.

### 4. Declarative Property Mapping with `[MapFrom]`

Need to rename a property or access nested values? Use the `[MapFrom]` attribute:

```csharp
[Facet(typeof(User), GenerateToSource = true)]
public partial class UserDto
{
    // Simple property rename with reverse mapping
    [MapFrom(nameof(User.FirstName), Reversible = true)]
    public string Name { get; set; } = string.Empty;

    // Access nested property
    [MapFrom("Company.Name")]
    public string CompanyName { get; set; } = string.Empty;

    // Computed expression (one-way only)
    [MapFrom("FirstName + \" \" + LastName")]
    public string FullName { get; set; } = string.Empty;
}
```

### 5. Conditional Mapping with `[MapWhen]`

Map properties only when conditions are met - perfect for status-dependent fields:

```csharp
[Facet(typeof(Order))]
public partial class OrderDto
{
    public OrderStatus Status { get; set; }

    // Only map when order is completed
    [MapWhen("Status == OrderStatus.Completed")]
    public DateTime? CompletedAt { get; set; }

    // Boolean condition
    [MapWhen("IsActive")]
    public string? Email { get; set; }

    // Multiple conditions (AND logic)
    [MapWhen("IsActive")]
    [MapWhen("Status != OrderStatus.Cancelled")]
    public string? TrackingNumber { get; set; }
}
```

### 6. Advanced Flattening with FK Clash Detection

When working with EF Core entities, flattening complex hierarchies is common. But what happens when you have multiple foreign keys to the same table?

```csharp
public class Order
{
    public int CustomerId { get; set; }
    public Customer Customer { get; set; }

    public int BillingCustomerId { get; set; }
    public Customer BillingCustomer { get; set; }  // Same type!
}
```

**Traditional mappers** will create `CustomerId` and `CustomerId2` (ugly numeric suffixes) or fail.

**Facet detects this** and can intelligently handle FK clashes:

```csharp
[Flatten(typeof(Order), IgnoreForeignKeyClashes = true)]
public partial class OrderFlatDto;
// Generates: CustomerId, CustomerName, BillingCustomerId, BillingCustomerName
// No ugly CustomerId2!
```

This is a **unique feature** - no other mapping library handles this scenario automatically.

### 7. EF Core Query Projections - No `.Include()` Required!

This is one of Facet's **most powerful features**: automatic JOIN generation for nested objects.

**The Traditional EF Core Pain:**

With traditional mappers, you MUST remember to `.Include()` every navigation property:

```csharp
// AutoMapper, Mapperly, Mapster - ALL require explicit includes:
var users = await dbContext.Users
    .Include(u => u.Address)           // Required! Forget = null reference
    .Include(u => u.Orders)            // Required! Forget = N+1 queries
        .ThenInclude(o => o.Items)     // Nested includes get complex fast
    .Include(u => u.Department)        // Required!
        .ThenInclude(d => d.Manager)   // More nesting...
    .Where(u => u.IsActive)
    .ProjectTo<UserDto>(_mapper.ConfigurationProvider)
    .ToListAsync();

// Forget ONE .Include()?
// - Null reference exception
// - N+1 query performance
// - Runtime production bugs
```

**The Facet Solution:**

```csharp
// Define once what nested objects you need
[Facet(typeof(User),
    NestedFacets = [typeof(AddressDto), typeof(OrderDto), typeof(DepartmentDto)])]
public partial record UserDto;

[Facet(typeof(Order), NestedFacets = [typeof(OrderItemDto)])]
public partial record OrderDto;

// Query ANYWHERE without includes
var users = await dbContext.Users
    .Where(u => u.IsActive)
    .SelectFacet<UserDto>()            // Automatically includes ALL nested facets
    .ToListAsync();                    // -> Address, Orders, Items, Department, Manager
```

**What Facet does automatically:**
1. Analyzes the Facet definition at compile time
2. Detects all `NestedFacets` (including nested-nested facets)
3. Generates optimal SQL projection with proper JOINs
4. Eliminates N+1 queries entirely
5. Returns fully populated DTOs in a single database round-trip

**Benefits:**
- **Zero** `.Include()` calls to remember
- **Zero** N+1 query risk
- **Compile-time safety** (add a nested facet -> SQL updates automatically)
- **Consistent queries** across your codebase
- **Add new navigation properties** -> update Facet -> all queries fixed

This alone can eliminate debugging time and **countless production issues**.

### 8. Custom Mapping Logic When You Need It

Facet is convention-based, but you can add custom logic when needed:

```csharp
public class UserMapper : IFacetMapConfiguration<User, UserDto>
{
    public static void Map(User source, UserDto target)
    {
        target.FullName = $"{source.FirstName} {source.LastName}";
        target.IsAdult = source.Age >= 18;
    }
}

// Link the custom mapper via the Configuration property
[Facet(typeof(User), Configuration = typeof(UserMapper))]
public partial class UserDto
{
    public string FullName { get; set; } = string.Empty;
    public bool IsAdult { get; set; }
}
```

Or with async and dependency injection:

```csharp
public class UserAsyncMapper : IFacetMapConfigurationAsyncInstance<User, UserDto>
{
    private readonly IProfilePictureService _profileService;

    public UserAsyncMapper(IProfilePictureService profileService)
    {
        _profileService = profileService;
    }

    public async Task MapAsync(User source, UserDto target, CancellationToken ct = default)
    {
        target.ProfilePicture = await _profileService.GetAsync(source.Id, ct);
    }
}
```

### 9. CRUD DTO Generation

For common CRUD operations, Facet can generate entire DTO sets:

```csharp
[GenerateDtos(Types = DtoTypes.All, OutputType = OutputType.Record)]
public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
}
```

This generates:
- `CreateUserRequest` (excludes Id)
- `UpdateUserRequest` (includes Id)
- `UserResponse` (includes all)
- `UserQuery` (all properties nullable for filtering)
- `UpsertUserRequest` (for create/update operations)
- `PatchUserRequest` (for partial updates)

All with appropriate properties and mapping logic.

### 10. Breaking Change Detection with SourceSignature

Track changes to your source entities and get compile-time warnings when the structure changes:

```csharp
// Add a signature to lock the API contract
[Facet(typeof(User), SourceSignature = "a83684c8")]
public partial class UserDto;
```

When someone modifies the `User` entity, you'll get a compile-time warning:
```
warning FAC022: Source entity 'User' structure has changed.
Update SourceSignature to 'e5f6g7h8' to acknowledge this change.
```

This prevents:
- New sensitive fields silently appearing in API responses
- Breaking changes going unnoticed
- Accidental data exposure

### 11. Reference-Based Wrappers

Need a facade that delegates to the source object instead of copying values? Use `[Wrapper]`:

```csharp
// Hide sensitive properties with a facade
[Wrapper(typeof(User), nameof(User.Password), nameof(User.Salary))]
public partial class PublicUserWrapper { }

// Usage - changes propagate to source!
var user = new User { Id = 1, FirstName = "John", Password = "secret" };
var wrapper = new PublicUserWrapper(user);

wrapper.FirstName = "Jane";
Console.WriteLine(user.FirstName);  // "Jane" - source is modified!

// Read-only wrappers for immutable facades
[Wrapper(typeof(Product), ReadOnly = true)]
public partial class ReadOnlyProductView { }
```

## When You Might Still Want a Traditional Mapper

Facet's DTO generation approach isn't always the right fit. Here's when you might prefer a traditional mapper:

### Mapperly Makes Sense When:
- You need **maximum control** over every DTO property definition
- Your team prefers **explicit over convention-based** code
- You have **complex, irregular mappings** that don't follow patterns
- You want to see every mapping method explicitly defined

### Mapster/AutoMapper Make Sense When:
- You have **existing DTOs** from external sources (third-party APIs, legacy code)
- You need to **map between types you don't control**
- You're working with a **large legacy codebase** where migration cost is too high
- You have **runtime mapping requirements** (dynamic type mapping)

### Facet Makes Sense When:
- You're **starting a new project** or module
- Your DTOs are **projections of domain models** (most API scenarios)
- You want to **minimize maintenance burden** (DRY principle)
- You frequently need **bidirectional mapping**
- You work with **EF Core entities** and need efficient projections
- You prefer **convention over configuration**
- You want **compile-time safety** with minimal boilerplate

## Performance at Scale

Let's address the elephant in the room: does DTO generation scale?

**Compile Time:**
Facet is a source generator, so it runs during compilation. For a project with:
- 100 domain models
- 200 Facets (multiple DTOs per model)
- Complex nesting

**Compile time increase:** ~2-5 seconds (incremental builds unaffected)

**Runtime Performance:**
Zero overhead. Generated code is identical to what you'd write manually:

```csharp
// What you write
[Facet(typeof(User), Include = ["Id", "FirstName", "LastName"], GenerateToSource = true)]
public partial record UserDto;

// What Facet generates (simplified)
public partial record UserDto
{
    public int Id { get; init; }
    public string FirstName { get; init; }
    public string LastName { get; init; }

    public UserDto() { }

    public UserDto(User source)
    {
        Id = source.Id;
        FirstName = source.FirstName;
        LastName = source.LastName;
    }

    public User ToSource() => new User
    {
        Id = this.Id,
        FirstName = this.FirstName,
        LastName = this.LastName
    };

    public static Expression<Func<User, UserDto>> Projection =>
        u => new UserDto
        {
            Id = u.Id,
            FirstName = u.FirstName,
            LastName = u.LastName
        };
}
```

No reflection. No runtime overhead. Just plain C# code.

## The Competitive Landscape in Late 2025

The mapping library landscape has shifted dramatically:

### AutoMapper: The Commercial Pivot
In April 2025, AutoMapper transitioned to commercial licensing (v15.0+). This prompted major migrations:
- ABP Framework moved to Mapperly
- Many enterprise projects reevaluating costs
- Open-source projects seeking alternatives

**Impact:** Accelerated adoption of free, modern alternatives like Facet and Mapperly.

### Mapster: Uncertain Future
Mapster's development has slowed considerably:
- Last major release: 2023
- Community concerns about long-term support
- No clear roadmap

**Impact:** Risky for new projects; existing users monitoring alternatives.

### Mapperly: The Rising Star
Mapperly has emerged as the "official" AutoMapper replacement:
- Active development
- Adopted by ABP Framework
- Growing community and documentation
- Explicit, transparent approach

**Competition:** Facet vs Mapperly is the interesting battle. Both use source generators, but:
- **Mapperly:** Explicit control, manual DTO definition, verbose but clear
- **Facet:** Convention-based, automatic DTO generation, concise but "magical"

**Use both?** Absolutely. Facet for standard projections, Mapperly for complex custom mappings.

## Getting Started with Facet

### Installation

```bash
dotnet add package Facet
```

For LINQ helpers:
```bash
dotnet add package Facet.Extensions
```

For EF Core integration:
```bash
dotnet add package Facet.Extensions.EFCore
```

For advanced mapping with DI support:
```bash
dotnet add package Facet.Mapping
```

### Your First Facet

1. **Define your domain model** (you already have this)

```csharp
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public string InternalCode { get; set; }  // Don't expose this
}
```

2. **Create a Facet** (instead of a manual DTO)

```csharp
[Facet(typeof(Product), nameof(Product.InternalCode), GenerateToSource = true)]
public partial record ProductDto;
```

3. **Use it**

```csharp
// Map from entity
var product = await _dbContext.Products.FindAsync(id);
var dto = new ProductDto(product);

// Map back to entity
var updatedProduct = dto.ToSource();

// EF projection (no .Include() needed even with nested objects!)
var products = await _dbContext.Products
    .Where(p => p.Price > 100)
    .SelectFacet<ProductDto>()
    .ToListAsync();
```

That's it. No profiles, no mapper classes, no configuration, **no `.Include()` calls**.

### Learning Path

1. **Start simple:** Basic Facets with include/exclude
2. **Add nesting:** Use `NestedFacets` for complex objects
3. **Property mapping:** Use `[MapFrom]` for renaming and expressions
4. **Conditional mapping:** Use `[MapWhen]` for status-dependent fields
5. **Try flattening:** Use `[Flatten]` for EF entities
6. **Custom logic:** Add `IFacetMapConfiguration` when needed
7. **CRUD generation:** Use `[GenerateDtos]` for boilerplate reduction
8. **Breaking detection:** Add `SourceSignature` before release

**Documentation:** [github.com/Tim-Maes/Facet/wiki](https://github.com/Tim-Maes/Facet/wiki)

## Facet vs Traditional Mappers: The Verdict

| Criteria | Traditional Mappers | Facet |
|----------|-------------------|-------|
| **Files to maintain** | 3+ (model, DTO, mapper) | 1 (model + attribute) |
| **Lines of code** | High | Low |
| **Boilerplate** | Significant | Minimal |
| **Compile-time safety** | Varies | Full |
| **Performance** | Varies (slow to fast) | Fastest (source gen) |
| **Bidirectional** | Manual configuration | Automatic |
| **Nested objects** | Manual configuration | Automatic |
| **EF projections** | Supported | Automatic + optimized |
| **.Include() management** | **Manual (error-prone)** | **Automatic (zero config)** |
| **N+1 query risk** | **High (if .Include() forgotten)** | **Zero (auto JOINs)** |
| **Property renaming** | ForMember config | **`[MapFrom]` attribute** |
| **Conditional mapping** | Custom code | **`[MapWhen]` attribute** |
| **Breaking change detection** | None | **SourceSignature** |
| **Learning curve** | Medium | Low |
| **Flexibility** | High (you write everything) | Medium (convention-based) |
| **Best for** | Complex custom mappings | Standard projections/DTOs |

**The answer isn't "Facet replaces all mappers."** It's "**Facet eliminates 80% of mapping scenarios**, and you can use a traditional mapper for the remaining 20%."

## Why Facet Matters in 2025

The .NET ecosystem is moving toward:
1. **Source generators** over reflection
2. **Compile-time safety** over runtime errors
3. **Less boilerplate** over explicit verbosity
4. **Convention over configuration** where sensible

Facet embodies all four trends while competing head-to-head with established mapping libraries on performance and features.

### The Value Proposition

**For individual developers:**
- Write less code
- Ship faster
- Fewer bugs
- Better performance (source generation)

**For teams:**
- Easier onboarding (less mapping code to understand)
- Consistent patterns (attributes vs varied mapper configs)
- Reduced maintenance (no manual DTO sync)
- Lower costs (MIT license vs AutoMapper commercial)

**For enterprises:**
- No vendor lock-in (open source, MIT)
- Future-proof (active development, growing community)
- Reduced technical debt (less code to maintain)
- Easy migration path (from AutoMapper/Mapster)

## The Road Ahead

Facet is actively developed with a clear roadmap:
- Enhanced flattening capabilities
- Better IDE tooling and diagnostics
- Extended CRUD generation options
- Performance optimizations
- Growing documentation and examples

## Conclusion: A Different Approach to an Old Problem

Traditional mapping libraries ask: *"How do we efficiently map between these two classes?"*

Facet asks: *"Why are you writing both classes?"*

By generating DTOs from domain models, Facet eliminates the root cause of mapping complexity: **duplication**. You define your model once, and Facet creates the projections you need with mapping built-in.

**Is Facet better than AutoMapper/Mapster/Mapperly?**

That's the wrong question.

**Does Facet solve the DTO/mapping problem differently - with less code, better performance, and equal or better features?**

Yes.

And in 2025, with AutoMapper now commercial and the .NET ecosystem embracing source generators, Facet's approach isn't just competitive - it might be **the future of DTO management in .NET**.

---

## Resources

- **GitHub Repository:** [github.com/Tim-Maes/Facet](https://github.com/Tim-Maes/Facet)
- **Documentation:** [Full docs with examples](https://github.com/Tim-Maes/Facet/wiki)
- **NuGet Packages:**
  - `dotnet add package Facet` (core generator)
  - `dotnet add package Facet.Extensions` (LINQ helpers)
  - `dotnet add package Facet.Extensions.EFCore` (EF Core async)
  - `dotnet add package Facet.Mapping` (custom mappers with DI)
- **Performance Benchmarks:** [Community benchmarks](https://github.com/mjebrahimi/Benchmark.netCoreMappers)

---