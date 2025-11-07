---
layout: post
title: "Facet: A Source Generator Competing with Traditional Mapping Libraries"
date: 2025-11-07 14:00:00 +0000
categories: [dotnet, csharp, source-generators, dto]
tags: [facet, automapper, mapperly, mapster, object-mapping, source-generation]
---

## The Mapper Problem We've Been Solving Wrong

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

## Introducing Facet: Generate DTOs, Not Just Mappings

### What is Facetting?

Think of a **diamond**. The whole stone is your domain model, it contains everything about the entity. But when you view it from different angles, you see different **facets**: specific views that show only what matters from that perspective.

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
    public decimal Salary { get; set; }
    public Address Address { get; set; }
}

// 2. Tell Facet what you want
[Facet(typeof(User), exclude: ["PasswordHash", "Salary"], NestedFacets = [typeof(AddressDto)])]
public partial record UserDto;

[Facet(typeof(Address))]
public partial record AddressDto;
```

That's it. **No step #3. No step #4.** Facet generates both the DTO class and the mapping logic at compile time.

## How Facet Competes with Traditional Mappers

Let's be clear about what Facet is competing with: AutoMapper, Mapster, and Mapperly are the main players in .NET object mapping. AutoMapper (296M+ downloads) went commercial in April 2025. Mapster (7.4M downloads) has an uncertain development future. Mapperly is the rising star with active development and adoption by major frameworks like ABP.

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
| **Bidirectional Mapping** | Manual config | Auto | Manual methods | **Auto `BackTo()`** |
| **Nested Objects** |  Manual config | Basic auto | Manual | **Auto with `NestedFacets`** |
| **Advanced Flattening** | Convention-based | Convention-based | Limited | **`[Flatten]` attribute** |
| **FK Clash Detection** | No | No | No | **Yes (unique)** |
| **EF Core Projections** | `ProjectTo<>()` | Yes | Manual | **Auto `SelectFacet<>()`** |
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
var dto = new UserDto(user);           // Forward mapping
var user = dto.BackTo<User>;                // Reverse mapping (auto-generated)
```

Facet automatically generates bidirectional mapping. No need to define both directions.

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

### 4. Advanced Flattening with FK Clash Detection

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

### 5. EF Core Query Projections - No `.Include()` Required!

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
// → Null reference exception
// → N+1 query performance hell
// → Runtime production bugs
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
    .ToListAsync();                    // → Address, Orders, Items, Department, Manager
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
- **Compile-time safety** (add a nested facet → SQL updates automatically)
- **Consistent queries** across your codebase
- **Add new navigation properties** → update Facet → all queries fixed

This alone can eliminate debugging time and **countless production issues**.

### 6. Custom Mapping Logic When You Need It

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

### 7. CRUD DTO Generation

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
- `CreateUserRequest`
- `UpdateUserRequest`
- `UserResponse`
- `UserQuery`
- `UpsertUserRequest`

All with appropriate properties and mapping logic.

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

## Real-World Comparison: AutoMapper Migration

Let's look at a realistic scenario - migrating from AutoMapper to Facet.

### Before (AutoMapper)

**Domain Model:**
```csharp
public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public DateTime CreatedAt { get; set; }
    public Address Address { get; set; }
    public List<Order> Orders { get; set; }
}
```

**DTO (manual):**
```csharp
public class UserDto
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public AddressDto Address { get; set; }
    public List<OrderSummaryDto> Orders { get; set; }
}

public class AddressDto
{
    public string Street { get; set; }
    public string City { get; set; }
    public string Country { get; set; }
}

public class OrderSummaryDto
{
    public int Id { get; set; }
    public decimal Total { get; set; }
    public DateTime OrderDate { get; set; }
}
```

**Mapping Profile:**
```csharp
public class UserMappingProfile : Profile
{
    public UserMappingProfile()
    {
        CreateMap<User, UserDto>().ReverseMap();
        CreateMap<Address, AddressDto>().ReverseMap();
        CreateMap<Order, OrderSummaryDto>();
    }
}
```

**Usage:**
```csharp
// Controller - Must remember ALL includes
var user = await _dbContext.Users
    .Include(u => u.Address)         
    .Include(u => u.Orders)          
    .Where(u => u.Id == id)
    .FirstOrDefaultAsync();

var dto = _mapper.Map<UserDto>(user);

// Or with ProjectTo (still requires knowing about navigation properties)
var dto = await _dbContext.Users
    .Where(u => u.Id == id)
    .ProjectTo<UserDto>(_mapper.ConfigurationProvider)
    .FirstOrDefaultAsync();
```

**Total:** 3 files, ~90 lines of code, manual `.Include()` management

### After (Facet)

**Facets (generated DTOs):**
```csharp
[Facet(typeof(User),
    exclude: ["PasswordHash"],
    NestedFacets = [typeof(AddressDto), typeof(OrderSummaryDto)])]
public partial record UserDto;

[Facet(typeof(Address))]
public partial record AddressDto;

[Facet(typeof(Order), include: ["Id", "Total", "OrderDate"])]
public partial record OrderSummaryDto;
```

**Usage:**
```csharp
// Controller - NO .Include() needed!
var dto = await _dbContext.Users
    .Where(u => u.Id == id)
    .SelectFacet<UserDto>()            // Automatically includes Address & Orders
    .FirstOrDefaultAsync();            // Single optimized SQL query with JOINs

// Or with loaded entity
var user = await _dbContext.Users.FindAsync(id);
var dto = new UserDto(user);
```

**Total:** 1 file, ~10 lines of code (89% reduction), **zero `.Include()` management**

### Migration Effort

| Aspect | Effort | Notes |
|--------|--------|-------|
| Simple DTOs | Very Low | Replace DTO class with `[Facet]` attribute |
| Nested Objects | Low | Add `NestedFacets` parameter |
| Custom Logic | Medium | Convert resolvers to `IFacetMapConfiguration` |
| Validation Attributes | Auto | Facet copies them automatically |
| EF Projections | Improved | Replace `ProjectTo<>()` with `SelectFacet<>()` |
| .Include() Calls | **Eliminated** | Remove all `.Include()` - Facet handles automatically |

Most AutoMapper code migrates in **minutes to hours**, not days.

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
[Facet(typeof(User), include: ["Id", "FirstName", "LastName"])]
public partial record UserDto;

// What Facet generates (very simplified)
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

    public User BackTo() => new User
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

For EF Core integration:
```bash
dotnet add package Facet.Extensions.EFCore
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
[Facet(typeof(Product), exclude: ["InternalCode"])]
public partial record ProductDto;
```

3. **Use it**

```csharp
// Map from entity
var product = await _dbContext.Products.FindAsync(id);
var dto = new ProductDto(product);

// Map back to entity
var updatedProduct = dto.BackTo<Product>;

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
3. **Try flattening:** Use `[Flatten]` for EF entities
4. **Custom logic:** Add `IFacetMapConfiguration` when needed
5. **CRUD generation:** Use `[GenerateDtos]` for boilerplate reduction

**Documentation:** [github.com/Tim-Maes/Facet/docs](https://github.com/Tim-Maes/Facet/tree/master/docs)

## Facet vs Traditional Mappers: The Verdict

| Criteria | Traditional Mappers | Facet |
|----------|-------------------|-------|
| **Files to maintain** | 3+ (model, DTO, mapper) | 1 (model + attribute) |
| **Lines of code** | High | Low|
| **Boilerplate** | Significant | Minimal |
| **Compile-time safety** | Varies | Full |
| **Performance** | Varies (slow to fast) | Fastest (source gen) |
| **Bidirectional** | Manual configuration | Automatic |
| **Nested objects** | Manual configuration | Automatic |
| **EF projections** | Supported | Automatic + optimized |
| **.Include() management** | **Manual (error-prone)** | **Automatic (zero config)** |
| **N+1 query risk** | **High (if .Include() forgotten)** | **Zero (auto JOINs)** |
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

And in 2025, with AutoMapper now commercial and the .NET ecosystem embracing source generators, Facet's approach isn't just competitive, it might be **the future of DTO management in .NET**.

---

## Resources

- **GitHub Repository:** [github.com/Tim-Maes/Facet](https://github.com/Tim-Maes/Facet)
- **Documentation:** [Full docs with examples](https://github.com/Tim-Maes/Facet/tree/master/docs)
- **NuGet Package:** `dotnet add package Facet`
- **EF Core Extensions:** `dotnet add package Facet.Extensions.EFCore`
- **Performance Benchmarks:** [Community benchmarks](https://github.com/mjebrahimi/Benchmark.netCoreMappers)

---

