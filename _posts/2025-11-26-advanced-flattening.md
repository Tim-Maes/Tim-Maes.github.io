---
layout: post
title: "Advanced Flattening with Facet .NET"
date: 2025-11-04
categories: [dotnet, csharp, source-generators]
tags: [facet, dto, api, source-generation, entity-framework]
---

<div style="text-align: center; margin: 2rem 0;">
  <a href="https://www.github.com/Tim-Maes/Facet" target="_blank">
    <img src="https://github.com/Tim-Maes/Facet/blob/master/assets/Facet.png?raw=true" alt="Facet Logo" style="max-width: 100%; width: 600px; height: auto; display: block; margin: 0 auto; border-radius: 8px;" />
  </a>
</div>

# Advanced Flattening with Facet: From Nested Hierarchies to Flat DTOs

If you've ever found yourself writing DTOs with properties like `CustomerAddressStreet`, `CustomerAddressCity`, `ShippingAddressLine1`, and `ShippingAddressZipCode`, you know the pain of manually flattening nested object structures. It's tedious, error-prone, and clutters your codebase with boilerplate.

What if I told you there's a better way? With Facet's flattening features, you can transform complex hierarchical models into flat, denormalized DTOs automatically—perfect for API responses, reports, exports, and any scenario where you need a simplified view of your data.

Let's dive into everything Facet can do with flattening.

## Table of Contents

1. [What is Flattening?](#what-is-flattening)
2. [The Flatten Attribute: Automatic Property Discovery](#the-flatten-attribute-automatic-property-discovery)
3. [Naming Strategies: Prefix, LeafOnly, and SmartLeaf](#naming-strategies-prefix-leafonly-and-smartleaf)
4. [Controlling What Gets Flattened](#controlling-what-gets-flattened)
5. [Advanced ID Management](#advanced-id-management)
6. [FlattenTo: Unpacking Collections into Rows](#flattento-unpacking-collections-into-rows)
7. [Real-World Examples](#real-world-examples)
8. [Best Practices](#best-practices)

## What is Flattening?

Flattening transforms a hierarchical object structure into a flat structure where all nested properties become top-level properties. Instead of accessing `person.Address.City`, you have `personFlat.AddressCity` directly.

### Why Flatten?

**API Responses**: Simplify JSON payloads for frontend consumption
```json
{
  "id": 1,
  "firstName": "John",
  "addressStreet": "123 Main St",
  "addressCity": "Springfield",
  "addressCountryName": "USA"
}
```

**Reports & Exports**: Perfect for CSV, Excel, or any tabular format
```csv
Id,FirstName,AddressStreet,AddressCity,AddressCountryName
1,John,123 Main St,Springfield,USA
```

**Database Queries**: Use LINQ projections for efficient EF Core queries
```csharp
var users = await dbContext.Users
    .Select(UserFlatDto.Projection)
    .ToListAsync();
```

## The Flatten Attribute: Automatic Property Discovery

The simplest way to flatten a type is with the `[Flatten]` attribute:

```csharp
public class Person
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public Address Address { get; set; }
}

public class Address
{
    public string Street { get; set; }
    public string City { get; set; }
    public string State { get; set; }
    public Country Country { get; set; }
}

public class Country
{
    public string Name { get; set; }
    public string Code { get; set; }
}

[Flatten(typeof(Person))]
public partial class PersonFlatDto
{
    // Facet generates all properties automatically!
}
```

### What Gets Generated?

```csharp
public partial class PersonFlatDto
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string AddressStreet { get; set; }
    public string AddressCity { get; set; }
    public string AddressState { get; set; }
    public string AddressCountryName { get; set; }
    public string AddressCountryCode { get; set; }

    // Constructor with null-safe access
    public PersonFlatDto(Person source)
    {
        this.Id = source.Id;
        this.FirstName = source.FirstName;
        this.LastName = source.LastName;
        this.AddressStreet = source.Address?.Street;
        this.AddressCity = source.Address?.City;
        this.AddressState = source.Address?.State;
        this.AddressCountryName = source.Address?.Country?.Name;
        this.AddressCountryCode = source.Address?.Country?.Code;
    }

    // LINQ projection for EF Core
    public static Expression<Func<Person, PersonFlatDto>> Projection => ...

    // Parameterless constructor for object initialization
    public PersonFlatDto() { }
}
```

Notice the **null-conditional operators** (`?.`) in the constructor—no more null reference exceptions when a nested object is missing!

## Naming Strategies: Prefix, LeafOnly, and SmartLeaf

Facet offers three naming strategies for flattened properties, each with different trade-offs.

### 1. Prefix Strategy (Default)

The safest option—concatenates the full path to create unique property names:

```csharp
[Flatten(typeof(Person), NamingStrategy = FlattenNamingStrategy.Prefix)]
public partial class PersonFlatDto { }

// Generated properties:
// - FirstName
// - AddressStreet
// - AddressCity
// - AddressCountryName ✓ Clear and unambiguous
```

**Pros**: No name collisions, clear property origins
**Cons**: Longer property names (but who cares with IntelliSense?)

### 2. LeafOnly Strategy

Uses only the final property name—shorter but risky:

```csharp
[Flatten(typeof(Person), NamingStrategy = FlattenNamingStrategy.LeafOnly)]
public partial class PersonFlatDto { }

// Generated properties:
// - FirstName
// - Street
// - City
// - Name  ← From Country.Name
```

**The Name Collision Problem:**

```csharp
public class Employee
{
    public string Name { get; set; }
    public Department Department { get; set; }
    public Manager Manager { get; set; }
}

public class Department
{
    public string Name { get; set; }  // Collision!
}

public class Manager
{
    public string Name { get; set; }  // Collision!
}

[Flatten(typeof(Employee), NamingStrategy = FlattenNamingStrategy.LeafOnly)]
public partial class EmployeeFlatDto { }

// Generated (with automatic numeric suffixes):
// - Name    (Employee.Name)
// - Name2   (Department.Name)
// - Name3   (Manager.Name)
```

Facet handles collisions automatically by adding numeric suffixes, but `Name2` and `Name3` aren't exactly intuitive!

### 3. SmartLeaf Strategy ⭐ (The Sweet Spot)

The best of both worlds—uses leaf names by default but adds the immediate parent prefix when collisions occur:

```csharp
public class DataItem
{
    public int Id { get; set; }
    public string DataValue { get; set; }  // No collision
    public ExtendedData ExtendedData { get; set; }
}

public class ExtendedData
{
    public Position Position { get; set; }
    public ItemType Type { get; set; }
}

public class Position
{
    public string Name { get; set; }  // Collision with Type.Name
}

public class ItemType
{
    public string Name { get; set; }  // Collision with Position.Name
}

[Flatten(typeof(DataItem), NamingStrategy = FlattenNamingStrategy.SmartLeaf)]
public partial class DataItemDto { }

// Generated properties:
// - Id
// - DataValue          ✓ No collision, uses leaf name
// - PositionName       ✓ Collision detected, uses parent prefix
// - TypeName           ✓ Collision detected, uses parent prefix
```

**SmartLeaf gives you short property names when possible and clear names when necessary.** It's the Goldilocks strategy!

### Strategy Comparison

| Example Property Path | Prefix | LeafOnly | SmartLeaf |
|----------------------|--------|----------|-----------|
| `Address.Street` (unique) | `AddressStreet` | `Street` | `Street` |
| `Position.Name` (collides) | `PositionName` | `Name` | `PositionName` |
| `Type.Name` (collides) | `TypeName` | `Name2` | `TypeName` |
| `Address.Country.Code` | `AddressCountryCode` | `Code` | `Code` |

## Controlling What Gets Flattened

### Excluding Properties

Exclude sensitive data, unwanted properties, or entire nested objects:

```csharp
// Exclude top-level properties
[Flatten(typeof(Employee), exclude: ["Salary", "SocialSecurityNumber"])]
public partial class EmployeePublicDto { }

// Exclude nested properties with dot notation
[Flatten(typeof(Person), exclude: ["Address.Country"])]
public partial class PersonWithoutCountryDto
{
    // Includes: FirstName, LastName, AddressStreet, AddressCity
    // Excludes: AddressCountryName, AddressCountryCode
}

// Exclude entire nested objects
[Flatten(typeof(User), exclude: ["PasswordHash", "SecuritySettings"])]
public partial class UserDisplayDto { }
```

### Controlling Depth

Limit how deep Facet traverses the object graph:

```csharp
// Default depth is 3 levels
[Flatten(typeof(Organization))]
public partial class OrgDto { }

// Limit to 2 levels for performance
[Flatten(typeof(Organization), MaxDepth = 2)]
public partial class OrgSummaryDto { }

// Example hierarchy
public class Organization
{
    public Location Headquarters { get; set; }  // Level 1
}

public class Location
{
    public Address Address { get; set; }  // Level 2
}

public class Address
{
    public City City { get; set; }  // Level 3 (included with default MaxDepth)
}

public class City
{
    public State State { get; set; }  // Level 4 (excluded with MaxDepth = 3)
}
```

**Safety Limit**: Even with `MaxDepth = 0` (unlimited), Facet enforces a hard limit of 10 levels to prevent stack overflow.

### What Types Are Flattened vs. Recursed?

**Flattened (treated as leaf properties):**
- Primitives: `int`, `bool`, `decimal`, etc.
- `string`
- Enums
- Date/time types: `DateTime`, `DateTimeOffset`, `TimeSpan`
- `Guid`
- Small value types (0-2 properties)

**Recursed (expanded into nested properties):**
- Complex reference types
- Value types with 3+ properties

**Completely Ignored:**
- **Collections** (`List<T>`, `IEnumerable<T>`, arrays, etc.)

Collections are skipped entirely during flattening. If you need to unpack collections, see the [FlattenTo](#flattento-unpacking-collections-into-rows) section!

## Advanced ID Management

### Problem: ID Overload

Entity Framework models often have ID properties everywhere:

```csharp
public class Order
{
    public int Id { get; set; }              // Primary key
    public int CustomerId { get; set; }      // Foreign key
    public Customer Customer { get; set; }
    public int? ShippingAddressId { get; set; }  // Foreign key
    public Address ShippingAddress { get; set; }
}

public class Customer
{
    public int Id { get; set; }              // Another ID!
}

public class Address
{
    public int Id { get; set; }              // Yet another ID!
}
```

Without any special handling, flattening creates a mess:

```csharp
[Flatten(typeof(Order))]
public partial class OrderDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }         // FK from root
    public int CustomerId2 { get; set; }        // Customer.Id (collision!)
    public int? ShippingAddressId { get; set; } // FK from root
    public int ShippingAddressId2 { get; set; } // Address.Id (collision!)
}
```

Yikes! Duplicate data and confusing naming.

### Solution 1: IgnoreNestedIds

Keep only the root-level `Id` and exclude all foreign keys and nested IDs:

```csharp
[Flatten(typeof(Order), IgnoreNestedIds = true)]
public partial class OrderDisplayDto
{
    // Generated:
    // public int Id { get; set; }               ✓ Root ID kept
    // public DateTime OrderDate { get; set; }
    // public string CustomerName { get; set; }
    // public string CustomerEmail { get; set; }
    // public string ShippingAddressStreet { get; set; }
    //
    // Excluded:
    // ✗ CustomerId (foreign key)
    // ✗ Customer.Id (nested ID)
    // ✗ ShippingAddressId (foreign key)
    // ✗ ShippingAddress.Id (nested ID)
}
```

**Perfect for:**
- Public APIs (don't expose internal database IDs)
- Reports and exports (human-readable data only)
- Search results (only need the primary ID for navigation)

### Solution 2: IgnoreForeignKeyClashes

Keep foreign keys but eliminate duplicate ID data:

```csharp
public class Person
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int? AddressId { get; set; }  // Foreign key
    public Address Address { get; set; } // Navigation property
}

public class Address
{
    public int Id { get; set; }
    public string Street { get; set; }
    public string City { get; set; }
}

[Flatten(typeof(Person), IgnoreForeignKeyClashes = true)]
public partial class PersonDto
{
    // Generated:
    // public int Id { get; set; }
    // public string Name { get; set; }
    // public int? AddressId { get; set; }     ✓ FK kept
    // public string AddressStreet { get; set; }
    // public string AddressCity { get; set; }
    //
    // Excluded:
    // ✗ Address.Id (would be duplicate of AddressId)
}
```

How does it work? Facet detects:
1. Properties ending with `"Id"` (e.g., `AddressId`)
2. Matching navigation properties (e.g., `Address`)
3. When flattening the navigation property, skips its `Id` since it would duplicate the FK

**Works at any depth:**

```csharp
public class Order
{
    public int CustomerId { get; set; }
    public Customer Customer { get; set; }
}

public class Customer
{
    public int Id { get; set; }
    public int? HomeAddressId { get; set; }  // Nested FK
    public Address HomeAddress { get; set; }
}

[Flatten(typeof(Order), IgnoreForeignKeyClashes = true)]
public partial class OrderDto
{
    // Generated:
    // public int CustomerId { get; set; }                  ✓
    // public string CustomerName { get; set; }             ✓
    // public string CustomerHomeAddressStreet { get; set; } ✓
    //
    // Excluded:
    // ✗ Customer.Id (clashes with CustomerId)
    // ✗ Customer.HomeAddressId (nested FK, also causes clash)
    // ✗ Customer.HomeAddress.Id (clashes with CustomerHomeAddressId)
}
```

### Combining Both Strategies

You can use both together, though `IgnoreNestedIds` is usually sufficient on its own:

```csharp
[Flatten(typeof(Order),
    IgnoreNestedIds = true,           // Remove all IDs except root
    IgnoreForeignKeyClashes = true)]  // Remove FK clash duplicates
public partial class OrderCleanDto { }
```

When both are enabled, `IgnoreNestedIds` takes precedence since it removes all ID-related properties anyway.

## FlattenTo: Unpacking Collections into Rows

While `[Flatten]` collapses nested objects into properties, **`FlattenTo`** unpacks collection properties into multiple rows—perfect for reports and exports!

### The Scenario

You have a parent entity with a collection of child entities, and you want to create one row per child item:

```csharp
public class Invoice
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; }
    public DateTime InvoiceDate { get; set; }
    public Customer Customer { get; set; }
    public ICollection<InvoiceItem> Items { get; set; }
}

public class InvoiceItem
{
    public int Id { get; set; }
    public string ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
```

**You want:** One row per invoice item, with invoice details repeated on each row.

### Setting Up FlattenTo

First, define facets for your entities:

```csharp
// Facet for the collection item
[Facet(typeof(InvoiceItem))]
public partial class InvoiceItemFacet;

// Facet for the parent with FlattenTo
[Facet(typeof(Invoice),
    NestedFacets = [typeof(InvoiceItemFacet)],
    FlattenTo = [typeof(InvoiceLineDto)])]
public partial class InvoiceFacet;
```

Then, define the flattened output DTO with the properties you want:

```csharp
public partial class InvoiceLineDto
{
    // Properties from Invoice (parent)
    public int Id { get; set; }
    public string InvoiceNumber { get; set; }
    public DateTime InvoiceDate { get; set; }
    public string CustomerName { get; set; }

    // Properties from InvoiceItem (child)
    public string ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}
```

### Generated FlattenTo Method

Facet generates a `FlattenTo()` method on `InvoiceFacet`:

```csharp
public partial class InvoiceFacet
{
    public List<InvoiceLineDto> FlattenTo()
    {
        if (Items == null)
        {
            return new List<InvoiceLineDto>();
        }

        return Items.Select(item => new InvoiceLineDto
        {
            // Parent properties (replicated for each row)
            Id = Id,
            InvoiceNumber = InvoiceNumber,
            InvoiceDate = InvoiceDate,
            CustomerName = Customer.Name,

            // Child properties (unique per row)
            ProductName = item.ProductName,
            Quantity = item.Quantity,
            UnitPrice = item.UnitPrice,
            LineTotal = item.Quantity * item.UnitPrice
        }).ToList();
    }
}
```

### Usage Example

```csharp
var invoice = new Invoice
{
    Id = 1001,
    InvoiceNumber = "INV-2025-001",
    InvoiceDate = new DateTime(2025, 11, 26),
    Customer = new Customer { Name = "ACME Corp" },
    Items = new List<InvoiceItem>
    {
        new() { ProductName = "Widget", Quantity = 5, UnitPrice = 10.00m },
        new() { ProductName = "Gadget", Quantity = 3, UnitPrice = 25.00m },
        new() { ProductName = "Doohickey", Quantity = 10, UnitPrice = 2.50m }
    }
};

var facet = new InvoiceFacet(invoice);
var rows = facet.FlattenTo();

// Result: 3 rows
foreach (var row in rows)
{
    Console.WriteLine($"{row.InvoiceNumber} | {row.ProductName} | {row.Quantity} x ${row.UnitPrice} = ${row.LineTotal}");
}

// Output:
// INV-2025-001 | Widget | 5 x $10.00 = $50.00
// INV-2025-001 | Gadget | 3 x $25.00 = $75.00
// INV-2025-001 | Doohickey | 10 x $2.50 = $25.00
```

### Nested Facets in Collections (NEW!)

As of version 5.0, `FlattenTo` can traverse **nested facets within collection items**!

#### Scenario: Lookup Tables

Many-to-many relationships use lookup/junction tables:

```csharp
public class Project
{
    public int Id { get; set; }
    public string Name { get; set; }
    public ICollection<ProjectEmployee> Assignments { get; set; }
}

public class ProjectEmployee  // Lookup table
{
    public int ProjectId { get; set; }
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; }  // Navigation to full employee data
    public DateTime AssignedDate { get; set; }
    public string Role { get; set; }
}

public class Employee
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Department { get; set; }
}
```

**You want:** One row per assignment with project details, assignment details, AND employee details.

#### Setup with Nested Facets

```csharp
// Facet for employee (inner nested)
[Facet(typeof(Employee))]
public partial class EmployeeFacet;

// Facet for lookup table with nested employee
[Facet(typeof(ProjectEmployee),
    NestedFacets = [typeof(EmployeeFacet)])]
public partial class ProjectEmployeeFacet;

// Facet for project with FlattenTo
[Facet(typeof(Project),
    NestedFacets = [typeof(ProjectEmployeeFacet)],
    FlattenTo = [typeof(ProjectAssignmentDto)])]
public partial class ProjectFacet;
```

#### Flattened Output

```csharp
public partial class ProjectAssignmentDto
{
    // From Project (parent)
    public int Id { get; set; }
    public string Name { get; set; }

    // From ProjectEmployee (collection item)
    public DateTime AssignedDate { get; set; }
    public string Role { get; set; }

    // From Employee (nested within collection item) ✨
    public string EmployeeName { get; set; }
    public string EmployeeEmail { get; set; }
    public string EmployeeDepartment { get; set; }
}
```

#### Generated Code

Facet automatically traverses into the nested `Employee` facet:

```csharp
public List<ProjectAssignmentDto> FlattenTo()
{
    return Assignments.Select(item => new ProjectAssignmentDto
    {
        Id = Id,
        Name = Name,
        AssignedDate = item.AssignedDate,
        Role = item.Role,
        EmployeeName = item.Employee.Name,              // ✨ Traverses nested!
        EmployeeEmail = item.Employee.Email,            // ✨ Traverses nested!
        EmployeeDepartment = item.Employee.Department   // ✨ Traverses nested!
    }).ToList();
}
```

**Key Features:**
- Recursively traverses up to 5 levels deep
- Automatically skips navigation properties that aren't configured as nested facets
- Handles property name collisions with intelligent prefixing
- Skips duplicate `Id` properties to avoid confusion

### FlattenTo Use Cases

**CSV/Excel Exports:**
```csharp
var exportRows = orders
    .Select(o => new OrderFacet(o))
    .SelectMany(f => f.FlattenTo())
    .ToList();

await csvWriter.WriteRecordsAsync(exportRows);
```

**Report Generation:**
```csharp
var reportData = await dbContext.Sales
    .Include(s => s.Items)
    .ToListAsync();

var reportRows = reportData
    .Select(s => new SaleFacet(s))
    .SelectMany(f => f.FlattenTo())
    .ToList();

await GeneratePdfReport(reportRows);
```

**API Endpoint:**
```csharp
[HttpGet("orders/{id}/lines")]
public async Task<IActionResult> GetOrderLines(int id)
{
    var order = await dbContext.Orders
        .Include(o => o.Items)
        .FirstOrDefaultAsync(o => o.Id == id);

    if (order == null) return NotFound();

    var facet = new OrderFacet(order);
    return Ok(facet.FlattenTo());
}
```

## Real-World Examples

### Example 1: Public API Response

**Goal:** Clean, denormalized API response without exposing database internals.

```csharp
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public decimal Price { get; set; }
    public int CategoryId { get; set; }
    public Category Category { get; set; }
    public int ManufacturerId { get; set; }
    public Manufacturer Manufacturer { get; set; }
    public decimal CostPrice { get; set; }      // Internal only
    public string InternalNotes { get; set; }   // Internal only
}

[Flatten(typeof(Product),
    exclude: ["CostPrice", "InternalNotes"],
    IgnoreNestedIds = true,
    NamingStrategy = FlattenNamingStrategy.SmartLeaf)]
public partial class ProductApiDto { }

// Usage
[HttpGet("products/{id}")]
public async Task<IActionResult> GetProduct(int id)
{
    var product = await dbContext.Products
        .Include(p => p.Category)
        .Include(p => p.Manufacturer)
        .Select(ProductApiDto.Projection)
        .FirstOrDefaultAsync(p => p.Id == id);

    return Ok(product);
}

// Response:
// {
//   "id": 42,
//   "name": "Professional Widget",
//   "description": "High-quality widget for professional use",
//   "price": 199.99,
//   "categoryName": "Tools",
//   "manufacturerName": "ACME Corp",
//   "manufacturerCountry": "USA"
// }
```

### Example 2: Employee Report with Complex Hierarchy

**Goal:** Generate an employee directory report with department and manager info.

```csharp
public class Employee
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public DateTime HireDate { get; set; }
    public decimal Salary { get; set; }           // Exclude
    public Department Department { get; set; }
    public Address HomeAddress { get; set; }
}

public class Department
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Code { get; set; }
    public Manager Manager { get; set; }
    public Location Location { get; set; }
}

public class Manager
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
}

public class Location
{
    public string Building { get; set; }
    public string Floor { get; set; }
    public Address Address { get; set; }
}

[Flatten(typeof(Employee),
    exclude: ["Salary", "HomeAddress"],  // Exclude sensitive/unnecessary data
    MaxDepth = 4,                         // Deep enough for nested locations
    NamingStrategy = FlattenNamingStrategy.Prefix,
    IgnoreNestedIds = true)]
public partial class EmployeeDirectoryDto { }

// Generate Excel report
var employees = await dbContext.Employees
    .Include(e => e.Department)
        .ThenInclude(d => d.Manager)
    .Include(e => e.Department)
        .ThenInclude(d => d.Location)
    .Select(EmployeeDirectoryDto.Projection)
    .ToListAsync();

await GenerateExcelReport(employees, "EmployeeDirectory.xlsx");

// Excel columns:
// Id | FirstName | LastName | Email | Phone | HireDate |
// DepartmentName | DepartmentCode | DepartmentManagerFirstName |
// DepartmentManagerLastName | DepartmentLocationBuilding |
// DepartmentLocationFloor | DepartmentLocationAddressCity | ...
```

### Example 3: Sales Report with Line Items

**Goal:** One row per sale line item with customer and product details.

```csharp
// Entities
public class Sale
{
    public int Id { get; set; }
    public string SaleNumber { get; set; }
    public DateTime SaleDate { get; set; }
    public Customer Customer { get; set; }
    public ICollection<SaleItem> Items { get; set; }
    public decimal Tax { get; set; }
}

public class SaleItem
{
    public int Id { get; set; }
    public Product Product { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
}

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string SKU { get; set; }
    public Category Category { get; set; }
}

// Facets
[Facet(typeof(Product))]
public partial class ProductFacet;

[Facet(typeof(SaleItem),
    NestedFacets = [typeof(ProductFacet)])]
public partial class SaleItemFacet;

[Facet(typeof(Sale),
    NestedFacets = [typeof(SaleItemFacet)],
    FlattenTo = [typeof(SalesReportLineDto)])]
public partial class SaleFacet;

// Flattened output
public partial class SalesReportLineDto
{
    // Sale info (replicated per line)
    public int Id { get; set; }
    public string SaleNumber { get; set; }
    public DateTime SaleDate { get; set; }
    public string CustomerName { get; set; }
    public string CustomerEmail { get; set; }

    // Sale item info
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }

    // Product info (from nested facet)
    public string ProductName { get; set; }
    public string ProductSKU { get; set; }
    public string ProductCategoryName { get; set; }

    // Calculated
    public decimal LineSubtotal => Quantity * UnitPrice;
    public decimal LineTotal => LineSubtotal - Discount;
}

// Generate report
var sales = await dbContext.Sales
    .Include(s => s.Customer)
    .Include(s => s.Items)
        .ThenInclude(i => i.Product)
            .ThenInclude(p => p.Category)
    .Where(s => s.SaleDate >= startDate && s.SaleDate <= endDate)
    .ToListAsync();

var reportRows = sales
    .Select(s => new SaleFacet(s))
    .SelectMany(f => f.FlattenTo())
    .ToList();

await GenerateCsvReport(reportRows, "SalesReport.csv");
```

## Best Practices

### 1. Choose the Right Naming Strategy

- **Prefix** (default): Safe choice, no collisions, clear origins
- **SmartLeaf**: Best balance of brevity and clarity
- **LeafOnly**: Only if you're certain no collisions exist (rare)

### 2. Set Appropriate MaxDepth

Don't flatten more than you need:
- **API responses**: Usually 2-3 levels is sufficient
- **Reports**: May need 4-5 levels for complex hierarchies
- **Exports**: Consider what's actually useful in tabular format

### 3. Use IgnoreNestedIds for Public APIs

Hide database implementation details:
```csharp
[Flatten(typeof(Entity), IgnoreNestedIds = true)]
public partial class PublicApiDto { }
```

### 4. Exclude Sensitive Data

Always exclude passwords, internal notes, cost prices, etc.:
```csharp
[Flatten(typeof(User), exclude: ["PasswordHash", "SecurityToken", "InternalNotes"])]
public partial class UserDisplayDto { }
```

### 5. Leverage LINQ Projections

Use the generated `Projection` property for efficient database queries:
```csharp
// ✓ Good: Database does the projection
var dtos = await dbContext.Users
    .Select(UserFlatDto.Projection)
    .ToListAsync();

// ✗ Bad: Loads full entities into memory first
var dtos = await dbContext.Users
    .ToListAsync()
    .Select(u => new UserFlatDto(u))
    .ToList();
```

### 6. Document Your Flattened Types

Add XML comments to explain what was flattened and why:
```csharp
/// <summary>
/// Flattened product view for public API consumption.
/// Excludes internal pricing and notes. Uses SmartLeaf naming for brevity.
/// </summary>
[Flatten(typeof(Product),
    exclude: ["CostPrice", "InternalNotes"],
    IgnoreNestedIds = true,
    NamingStrategy = FlattenNamingStrategy.SmartLeaf)]
public partial class ProductApiDto { }
```

### 7. Use FlattenTo for Denormalized Reports

When you need one-row-per-child-item output:
```csharp
// Perfect for CSV exports, Excel reports, etc.
var reportRows = orders
    .Select(o => new OrderFacet(o))
    .SelectMany(f => f.FlattenTo())
    .ToList();
```

### 8. Combine Strategies When Needed

```csharp
[Flatten(typeof(Order),
    exclude: ["InternalNotes", "CostPrice"],
    IgnoreNestedIds = true,
    IgnoreForeignKeyClashes = true,
    MaxDepth = 3,
    NamingStrategy = FlattenNamingStrategy.SmartLeaf)]
public partial class OrderCleanDto { }
```

## Conclusion

Facet's flattening features transform the tedious task of creating denormalized DTOs into a breeze:

- **`[Flatten]` attribute**: Automatically discover and flatten nested properties
- **Three naming strategies**: Choose between Prefix, LeafOnly, or SmartLeaf
- **Advanced ID management**: Clean up foreign key clutter with `IgnoreNestedIds` and `IgnoreForeignKeyClashes`
- **FlattenTo**: Unpack collections into rows with nested facet traversal
- **LINQ projections**: Efficient database queries with EF Core

Stop writing boilerplate flattening code. Let Facet do the heavy lifting while you focus on building features that matter.

Happy flattening!

---

**Want to try it out?**

Install Facet from NuGet:
```bash
dotnet add package Facet
```

**Learn more:**
Check out the [full documentation](https://github.com/Tim-Maes/Facet)
