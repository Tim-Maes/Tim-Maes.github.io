---
layout: post
title: "Faceted search in .NET"
date: 2025-12-15 12:00:00 +0000
tags: [facet, search, faceted, dotnet, generator]
---

# Faceted Search in .NET Made Easy: Introducing Facet.Search

*Eliminate boilerplate and build powerful, type-safe search experiences with source generators.*

---

If you're building an e-commerce site, a product catalog, or any application with advanced filtering, you know the pain: writing endless filter classes, mapping query parameters, building dynamic LINQ expressions, aggregating facet counts, and keeping everything in sync. It's tedious, error-prone, and a maintenance nightmare.

**What if all of that was generated automatically from your domain models?**

That's exactly what [Facet.Search](https://github.com/Tim-Maes/Facet.Search) does. It uses C# source generators to create type-safe filter classes, LINQ extensions, facet aggregations, and frontend metadata, all at compile time, with zero runtime overhead.

## The Problem: Faceted Search is Boilerplate Hell

Let's say you have a simple `Product` entity:

```csharp
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Brand { get; set; }
    public decimal Price { get; set; }
    public bool InStock { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

To build a typical faceted search, you'd need to:

1. **Create a filter DTO** with properties for each facet (brand list, min/max price, boolean flags)
2. **Write extension methods** to apply each filter conditionally
3. **Build aggregation queries** to count values per facet
4. **Handle null checks** everywhere
5. **Keep filter class in sync** with your model when properties change
6. **Create metadata** for your frontend to know what facets exist

Here's what that typically looks like:

```csharp
// The filter class you have to maintain
public class ProductSearchFilter
{
    public string[]? Brand { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? InStock { get; set; }
    public string? SearchText { get; set; }
}

// The extension method you have to write and maintain
public static class ProductSearchExtensions
{
    public static IQueryable<Product> ApplyFilter(
        this IQueryable<Product> query, 
        ProductSearchFilter filter)
    {
        if (filter.Brand?.Length > 0)
            query = query.Where(p => filter.Brand.Contains(p.Brand));
        
        if (filter.MinPrice.HasValue)
            query = query.Where(p => p.Price >= filter.MinPrice.Value);
        
        if (filter.MaxPrice.HasValue)
            query = query.Where(p => p.Price <= filter.MaxPrice.Value);
        
        if (filter.InStock.HasValue)
            query = query.Where(p => p.InStock == filter.InStock.Value);
        
        if (!string.IsNullOrWhiteSpace(filter.SearchText))
            query = query.Where(p => p.Name.Contains(filter.SearchText));
        
        return query;
    }
}
```

And you need to repeat this for every entity. Every time you add a property, you update the filter class, the extension method, the aggregations... you get the idea.

## The Solution: Declarative Attributes + Source Generation

With Facet.Search, you simply decorate your model:

```csharp
using Facet.Search;

[FacetedSearch]
public class Product
{
    public int Id { get; set; }

    [FullTextSearch]
    public string Name { get; set; } = null!;

    [FullTextSearch(Weight = 0.5f)]
    public string? Description { get; set; }

    [SearchFacet(Type = FacetType.Categorical, DisplayName = "Brand")]
    public string Brand { get; set; } = null!;

    [SearchFacet(Type = FacetType.Range, DisplayName = "Price")]
    public decimal Price { get; set; }

    [SearchFacet(Type = FacetType.Boolean, DisplayName = "In Stock")]
    public bool InStock { get; set; }

    [SearchFacet(Type = FacetType.DateRange, DisplayName = "Created Date")]
    public DateTime CreatedAt { get; set; }
}
```

**That's it.** The source generator creates everything else:

- `ProductSearchFilter` � A filter class with all the right properties
- `ProductSearchExtensions` � LINQ extension methods that apply filters
- `ProductFacetAggregations` � Aggregation result types
- `ProductSearchMetadata` � Facet metadata for your frontend

## Using the Generated Code

Once you've decorated your model, the generated code is immediately available:

```csharp
using YourNamespace.Search;

// Create a filter (properties are auto-generated based on your facets)
var filter = new ProductSearchFilter
{
    Brand = ["Apple", "Samsung"],
    MinPrice = 100m,
    MaxPrice = 1000m,
    InStock = true,
    SearchText = "laptop"
};

// Apply to any IQueryable<Product>
var results = dbContext.Products
    .ApplyFacetedSearch(filter)
    .ToList();
```

### Facet Aggregations

Need to show facet counts in your UI? Also generated:

```csharp
// Get all aggregations at once
var aggregations = dbContext.Products
    .AsQueryable()
    .GetFacetAggregations();

// aggregations.Brand = { "Apple": 42, "Samsung": 38, "Google": 25 }
// aggregations.PriceMin = 99.99m
// aggregations.PriceMax = 2499.99m
// aggregations.InStockTrue = 156
// aggregations.InStockFalse = 23
```

### Frontend Metadata

Building a dynamic filter UI? Use the generated metadata:

```csharp
// Access facet definitions for your API
foreach (var facet in ProductSearchMetadata.Facets)
{
    Console.WriteLine($"{facet.PropertyName}: {facet.DisplayName} ({facet.Type})");
}

// Output:
// Brand: Brand (Categorical)
// Price: Price (Range)
// InStock: In Stock (Boolean)
// CreatedAt: Created Date (DateRange)
```

This is perfect for building dynamic filter UIs�your frontend can discover what facets exist without hardcoding them.

## It's Real SQL, Not In-Memory Filtering

Here's the crucial part: **all generated filters translate to SQL**. There's no client-side evaluation, no loading entire tables into memory.

| Filter Type | Generated Expression | SQL Translation |
|-------------|---------------------|-----------------|
| Categorical | `.Where(x => filter.Brand.Contains(x.Brand))` | `WHERE Brand IN ('Apple', 'Samsung')` |
| Range | `.Where(x => x.Price >= min && x.Price <= max)` | `WHERE Price BETWEEN @min AND @max` |
| Boolean | `.Where(x => x.InStock == true)` | `WHERE InStock = 1` |
| DateRange | `.Where(x => x.CreatedAt >= from)` | `WHERE CreatedAt >= @from` |
| Full-Text | `.Where(x => x.Name.Contains(term))` | `WHERE Name LIKE '%term%'` |

Your database does the work, not your application server.

## Entity Framework Core Integration

For real-world applications, install the EF Core integration package:

```bash
dotnet add package Facet.Search.EFCore
```

This gives you async-first extensions designed for EF Core:

```csharp
using Facet.Search.EFCore;

// Async search execution
var results = await dbContext.Products
    .ApplyFacetedSearch(filter)
    .ExecuteSearchAsync();

// Paginated results with metadata
var pagedResult = await dbContext.Products
    .ApplyFacetedSearch(filter)
    .SortBy(p => p.Price, descending: true)
    .ToPagedResultAsync(page: 1, pageSize: 20);

// pagedResult.Items       - Products for this page
// pagedResult.TotalCount  - Total matching products
// pagedResult.TotalPages  - Number of pages
// pagedResult.HasNextPage - Pagination helpers
```

### Async Aggregations

```csharp
// Get categorical facet counts
var brandCounts = await dbContext.Products
    .AggregateFacetAsync(p => p.Brand, limit: 10);
// Returns: Dictionary<string, int> { "Apple": 42, "Samsung": 38, ... }

// Get min/max for range facets
var (minPrice, maxPrice) = await dbContext.Products
    .GetRangeAsync(p => p.Price);

// Count boolean values
var (inStock, outOfStock) = await dbContext.Products
    .CountBooleanAsync(p => p.InStock);
```

## Full-Text Search Options

The default full-text search uses `LIKE '%term%'` which works everywhere but doesn't leverage full-text indexes. For better performance on large datasets, configure a database-specific strategy:

```csharp
// SQL Server with FREETEXT (requires FULLTEXT index)
[FacetedSearch(FullTextStrategy = FullTextSearchStrategy.SqlServerFreeText)]
public class Product { }

// PostgreSQL with tsvector
[FacetedSearch(FullTextStrategy = FullTextSearchStrategy.PostgreSqlFullText)]
public class Product { }
```

### Manual Full-Text Search Extensions

The EF Core package also includes manual full-text search extensions:

```csharp
using Facet.Search.EFCore;

// Universal LIKE search (all databases)
var results = await dbContext.Products
    .LikeSearch(p => p.Name, "laptop")
    .ToListAsync();

// SQL Server FREETEXT (natural language with stemming)
var results = await dbContext.Products
    .FreeTextSearch(p => p.Name, "laptop computers")
    .ToListAsync();

// SQL Server CONTAINS (boolean operators)
var results = await dbContext.Products
    .ContainsSearch(p => p.Name, "laptop AND gaming")
    .ToListAsync();

// PostgreSQL ILike (case-insensitive)
var results = await dbContext.Products
    .ILikeSearch(p => p.Name, "LAPTOP")
    .ToListAsync();
```

## Real-World Example: Product Search API

Here's a complete API controller using Facet.Search:

```csharp
[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly ProductDbContext _context;

    public ProductsController(ProductDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string[]? brands,
        [FromQuery] decimal? minPrice,
        [FromQuery] decimal? maxPrice,
        [FromQuery] bool? inStock,
        [FromQuery] string? q,
        [FromQuery] string? sortBy,
        [FromQuery] bool descending = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var filter = new ProductSearchFilter
        {
            Brand = brands,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            InStock = inStock,
            SearchText = q
        };

        var query = _context.Products.ApplyFacetedSearch(filter);

        // Dynamic sorting
        query = sortBy?.ToLower() switch
        {
            "price" => query.SortBy(p => p.Price, descending),
            "name" => query.SortBy(p => p.Name, descending),
            "created" => query.SortBy(p => p.CreatedAt, descending),
            _ => query.SortBy(p => p.Name)
        };

        var result = await query.ToPagedResultAsync(page, pageSize);

        return Ok(result);
    }

    [HttpGet("facets")]
    public async Task<IActionResult> GetFacets()
    {
        var brands = await _context.Products
            .AggregateFacetAsync(p => p.Brand, limit: 20);
        
        var (minPrice, maxPrice) = await _context.Products
            .GetRangeAsync(p => p.Price);
        
        var (inStock, outOfStock) = await _context.Products
            .CountBooleanAsync(p => p.InStock);

        return Ok(new
        {
            brands,
            priceRange = new { min = minPrice, max = maxPrice },
            stock = new { inStock, outOfStock },
            metadata = ProductSearchMetadata.Facets
        });
    }
}
```

Your frontend can now:
1. Call `/api/products/facets` to get available filters and counts
2. Call `/api/products?brands=Apple&brands=Samsung&minPrice=500&inStock=true` to search
3. Display results with pagination

## Facet Types Explained

| Type | Use Case | Generated Properties |
|------|----------|---------------------|
| `Categorical` | Discrete values (Brand, Category, Color) | `string[]? PropertyName` |
| `Range` | Numeric ranges (Price, Rating, Weight) | `decimal? MinPropertyName`, `decimal? MaxPropertyName` |
| `Boolean` | Yes/No filters (In Stock, Featured) | `bool? PropertyName` |
| `DateRange` | Date filtering (Created, Modified) | `DateTime? PropertyNameFrom`, `DateTime? PropertyNameTo` |
| `Hierarchical` | Nested categories (Electronics > Phones > iPhone) | `string[]? PropertyName` |

## Advanced Configuration

### Custom Facet Settings

```csharp
[SearchFacet(
    Type = FacetType.Categorical,
    DisplayName = "Product Brand",      // UI-friendly name
    OrderBy = FacetOrder.Count,         // Sort by frequency
    Limit = 10,                         // Top 10 in aggregations
    DependsOn = "Category"              // Cascading filter
)]
public string Brand { get; set; }
```

### Full-Text Search Weights

```csharp
[FullTextSearch(Weight = 1.0f)]        // High priority
public string Title { get; set; }

[FullTextSearch(Weight = 0.5f)]        // Lower priority
public string Description { get; set; }
```

### Search Behaviors

```csharp
[FullTextSearch(Behavior = TextSearchBehavior.Contains)]    // LIKE '%term%'
public string Title { get; set; }

[FullTextSearch(Behavior = TextSearchBehavior.StartsWith)]  // LIKE 'term%'
public string Slug { get; set; }

[FullTextSearch(Behavior = TextSearchBehavior.Exact, CaseSensitive = true)]
public string Code { get; set; }
```

### Navigation Properties

Filter on related entities:

```csharp
public class Product
{
    [SearchFacet(
        Type = FacetType.Categorical,
        DisplayName = "Category",
        NavigationPath = "Category.Name"  // Filter on the related entity
    )]
    public Category Category { get; set; }
}
```

## Why Source Generators?

You might wonder: why source generators instead of runtime reflection?

1. **Zero runtime overhead** - All code is generated at compile time
2. **Full IntelliSense** - Generated types are real C# classes
3. **Compile-time safety** - Typos and misconfigurations fail the build
4. **No magic strings** - Everything is strongly typed
5. **AOT compatible** - Works with Native AOT compilation
6. **Debuggable** - You can step through the generated code

The generated files live in your `obj` folder and you can inspect them anytime:

```
obj/Debug/net8.0/generated/Facet.Search.Generators/
??? ProductSearchFilter.g.cs
??? ProductSearchExtensions.g.cs
??? ProductFacetAggregations.g.cs
??? ProductSearchMetadata.g.cs
```

## Performance Tips

1. **Add database indexes** on facet columns (`Brand`, `Price`, `InStock`)
2. **Use full-text indexes** for `FREETEXT`/`CONTAINS` on large text columns
3. **Set `Limit` on categorical facets** to avoid loading thousands of distinct values
4. **Cache aggregations** if they don't change frequently
5. **Use projection** with `.Select()` if you don't need all columns

## Installation

```bash
# Core package (required)
dotnet add package Facet.Search

# EF Core integration (recommended)
dotnet add package Facet.Search.EFCore
```

## Conclusion

Facet.Search eliminates the tedious boilerplate of building faceted search while keeping you in full control. You define *what* is searchable through attributes, and the source generator handles the *how*.

- Type-safe filter classes
- LINQ extensions that translate to SQL
- Facet aggregations
- Frontend metadata
- Full-text search with multiple strategies
- EF Core async support
- Zero runtime overhead

Give it a try on your next project:

- **GitHub**: [github.com/Tim-Maes/Facet.Search](https://github.com/Tim-Maes/Facet.Search)
- **NuGet**: [Facet.Search](https://www.nuget.org/packages/Facet.Search) | [Facet.Search.EFCore](https://www.nuget.org/packages/Facet.Search.EFCore)
- **Discord**: [Join the community](https://discord.gg/yGDBhGuNMB)

---

*Have questions or feedback? Open an issue on GitHub or join the Discord!*
