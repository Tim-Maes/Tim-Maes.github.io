## Autowiring using Bindicate

![Bindicate](https://miro.medium.com/v2/resize:fit:4800/format:webp/1*bBDhIFTi8GT5346fTIwQbg.png)  

As .NET developers, we’ve all been there — adding a new service to an application and realizing that we need to jump through hoops to wire it up in the IoC container. This often involves navigating through layers of code, digging through Startup.cs or equivalent files, and explicitly adding the new service. Wouldn’t it be great if there was a way to streamline this? Imagine a flag or marker that simply tells the framework, “Hey, I’m here, and I need to be registered with this scope.”

Well, that’s precisely what Bindicate aims to achieve.

---
### What is Bindicate?

Bindicate is a simple NuGet package designed to declutter your .NET configuration by enabling attribute-based service registration. By using attributes, you can dictate how your classes should be registered in the IoC container. It currently supports Scopes, Transients, and Singletons, both in the normal and “TryAdd” variants, and the keyed variants for .NET 8 and onwards.

#### Clean Code

You no longer have to comb through a mountain of `services.Add...<,>()` lines. Bindicate allows you to specify the registration logic at the service class level.

#### Better maintainability

When the registration is closely associated with the service class, it’s easier to change the scope of the service without hunting down the registration code in a different part of the project.

### Getting started

#### Installation

To get started, install the package from NuGet:

```bash
Install-Package Bindicate
```

### Usage

#### Decorating Services

Once installed, you can start decorating your service classes with Bindicate attributes. For example, to register a service as a Scoped dependency, you can do the following:

```csharp
[AddScoped]
public class MyScopedService
{
  // Implementation goes here
}

//Or

[AddTransient(typeof(IMyService))]
public class MyService: IMyService
{
    void DoThing() {}
}
public interface IMyService 
{
    void DoThing();
}
```

#### Bootstrapping

After your services are appropriately decorated, you need to initialize Bindicate in your Startup.cs (or program.cs in .NET6):

```csharp
// .NET6 in program.cs
builder.Services
  .AddAutopwiring(Assembly.GetExecutingAssembly())
  .Register();

// Startup.cs in earlier versions
public void ConfigureServices(IServiceCollection services)
{
    services.AddAutowiring(Assembly.GetExecutingAssembly())
        .Register();
    // Other configurations
}
```

Don’t forget to call `.Register()`!

And that’s it! Bindicate will now register your services based on the attributes you’ve specified.

### Keyed Services (.NET 8)
With keyed services, another piece of information is stored with the `ServiceDescriptor`, a `ServiceKey` that identifies the service. The key can be any object, but it will commonly be a string or an enum (something that can be a constant so it can be used in attributes). For non-keyed services, the `ServiceType` identifies the registration; for keyed services, the combination of `ServiceType` and `ServiceKey` identifies the registration.

To register a keyed service, you van use the `AddKeyed[Lifetime]` attribute and pass the key as parameters

```csharp
[AddKeyedScoped("myKey")]
public class KeyedService
{
 public void Run()
 {
  // ...
 }
}

[AddKeyedScoped("key", typeof(IKeyedService))]
public class KeyedService : IKeyedService
{
 public void Run()
 {
  // ...
 }
}

[AddKeyedScoped("anotherKey", typeof(IKeyedService))]
public class AnotherKeyedService : IKeyedService
{
 public void Run()
 {
  // ...
 }
}
```

#### Bootstrapping keyed services

Add the `ForKeyedServices()`  method call to your configuration

```csharp
// program.cs
builder.Services
   .AddAutopwiring(Assembly.GetExecutingAssembly())
   .ForKeyedServices()
   .Register();
```

## Registering options
In addition, you can register IOptions<T> to use pass options to your services.

```csharp
[RegisterOptions("testOptions")]
public class TestOptions
{
    public string Test { get; set; } = "";
}

//appsettings.json:
{
  "testOptions": {
    "test": "test"
  }
}
```

Then update your `ServiceCollectionExtensions` to autowire your options:

```csharp
builder.Services
    .AddAutowiringForAssembly(Assembly.GetExecutingAssembly())
    .WithOptions(Configuration)  //Pass builder.Configuration here
    .Register();
```

### Limitations

**Single Attribute Policy**: Bindicate currently supports only one attribute per class to prevent ambiguous registrations.

### Conclusion
Bindicate makes dependency injection in .NET applications clean and straightforward. By shifting the responsibility of registering services closer to the service classes themselves, it promotes cleaner and more maintainable code. So why not give it a try and simplify your DI configuration?

Find Bindicate on [NuGet](https://www.nuget.org/profiles/Tim-Maes) and on [GitHub](https://github.com/Tim-Maes/Bindicate).