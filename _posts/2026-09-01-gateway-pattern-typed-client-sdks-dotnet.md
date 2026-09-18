---
layout: post
title: "The Gateway Pattern: Building Typed Client SDKs in .NET"
date: 2026-09-01 12:00:00 +0000
tags: [dotnet, csharp, architecture, design-patterns, http-client]
excerpt: "How to structure a typed HTTP client SDK using the Gateway Pattern — a three-layer approach that separates URL construction, HTTP transport, and domain-meaningful operations into distinct responsibilities."
---

When you build an API, you eventually need to ship a client library. A NuGet package that lets consumers call your API through typed methods instead of hand-crafting HTTP requests. Azure SDK, Stripe, Octokit — they all do this.

But how do you structure one cleanly? Most examples stop at "register a typed HttpClient with `IHttpClientFactory`." That's the starting point, not the architecture.

In this post I'll walk through a three-layer refinement of the **Gateway Pattern** (from Martin Fowler's *Patterns of Enterprise Application Architecture*) that I've been using in production .NET systems.

<!--more-->

## The Problem

A naive typed client puts everything in one class:

```csharp
public class WeatherClient
{
    private readonly HttpClient _httpClient;

    public WeatherClient(HttpClient httpClient) => _httpClient = httpClient;

    public async Task<List<Forecast>> GetForecastsAsync(string city, int? days)
    {
        var url = $"v1/weather/forecasts?city={city}";
        if (days.HasValue) url += $"&days={days}";
        
        var response = await _httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<Forecast>>();
    }
}
```

This works for a single endpoint. But as your API grows to 20+ endpoints across multiple modules, this class becomes a dumping ground mixing three distinct concerns:

1. **URL construction** — query strings, path parameters, route prefixes
2. **HTTP mechanics** — making requests, deserializing responses, handling errors
3. **Consumer API** — convenience methods, input validation, domain-meaningful overloads

## The Gateway Pattern: Three Layers

The solution is to decompose the Gateway into three layers, each with a single responsibility:

| Layer | Responsibility | Visibility |
|-------|---------------|------------|
| **Endpoints** | "Where" — URL construction | `internal static` |
| **HttpClient** | "How" — transport & deserialization | `internal` |
| **Service** | "What" — domain-meaningful operations | `public` |

Consumers only ever see the **Service** layer. The rest is implementation detail.

### Project Structure

```
WeatherApi.Client/
  ClientModule.cs                          # Entry point: AddWeatherApiClient()
  Configuration/
    WeatherApiClientSettings.cs            # Settings + resilience config
  Core/
    HttpClientBase.cs                      # Base class for all HTTP clients
    ApiResult.cs                           # Success/failure wrapper
    ApiProblemDetails.cs                   # RFC 7807 error DTO
  Weather/
    WeatherEndpoints.cs                    # Layer 1: URL builders
    WeatherHttpClient.cs                   # Layer 2: HTTP operations
    WeatherService.cs                      # Layer 3: Public facade
    Contracts/
      IWeatherHttpClient.cs               # Internal contract
      IWeatherService.cs                  # Public contract
    Configuration/
      WeatherConfiguration.cs             # DI registration + resilience
    Input/
      WeatherInputs.cs                    # Request DTOs
    Output/
      WeatherOutputs.cs                   # Response DTOs
```

## Layer 1: Endpoints — "Where"

The Endpoints layer is a static class that constructs URLs. Nothing else. If the API changes its route structure, only this file changes.

```csharp
internal static class WeatherEndpoints
{
    private const string BasePath = "v1/weather";

    public static string GetForecasts(string? city, int? days)
    {
        var queryParams = new List<string>();

        if (!string.IsNullOrWhiteSpace(city))
            queryParams.Add($"city={Uri.EscapeDataString(city)}");

        if (days.HasValue)
            queryParams.Add($"days={days.Value}");

        var query = queryParams.Count > 0
            ? $"?{string.Join("&", queryParams)}"
            : string.Empty;

        return $"{BasePath}/forecasts{query}";
    }

    public static string GetForecastById(Guid id)
        => $"{BasePath}/forecasts/{id}";

    public static string SearchForecasts()
        => $"{BasePath}/forecasts/search";
}
```

This is deliberately boring. That's the point — URL construction is a mechanical task that deserves isolation, not interleaving with HTTP logic.

## Layer 2: HttpClient — "How"

The HttpClient layer handles raw HTTP operations. It extends a base class that provides common infrastructure (JSON deserialization, error handling), and uses the Endpoints layer to know where to call.

```csharp
internal sealed class WeatherHttpClient : HttpClientBase, IWeatherHttpClient
{
    public WeatherHttpClient(HttpClient httpClient) : base(httpClient) { }

    public Task<ApiResult<ListResponse<ForecastOutput>>> GetForecastsAsync(
        string? city, int? days, CancellationToken cancellationToken = default)
    {
        var url = WeatherEndpoints.GetForecasts(city, days);
        return GetAsync<ListResponse<ForecastOutput>>(url, cancellationToken);
    }

    public Task<ApiResult<ForecastOutput>> GetForecastByIdAsync(
        Guid id, CancellationToken cancellationToken = default)
    {
        var url = WeatherEndpoints.GetForecastById(id);
        return GetAsync<ForecastOutput>(url, cancellationToken);
    }

    public Task<ApiResult<ListResponse<ForecastOutput>>> SearchForecastsAsync(
        SearchForecastsInput input, CancellationToken cancellationToken = default)
    {
        var url = WeatherEndpoints.SearchForecasts();
        return PostAsync<ListResponse<ForecastOutput>>(url, input, cancellationToken);
    }
}
```

The `HttpClientBase` handles the repetitive parts — deserializing JSON, mapping error responses to `ApiResult<T>`, processing RFC 7807 ProblemDetails:

```csharp
public abstract class HttpClientBase
{
    protected HttpClient HttpClient { get; }

    protected HttpClientBase(HttpClient httpClient) => HttpClient = httpClient;

    protected async Task<ApiResult<T>> GetAsync<T>(
        string url, CancellationToken cancellationToken = default)
    {
        var response = await HttpClient.GetAsync(url, cancellationToken);

        if (!response.IsSuccessStatusCode)
            return await HandleErrorResponse<T>(response, cancellationToken);

        var result = await response.Content
            .ReadFromJsonAsync<T>(JsonOptions, cancellationToken);

        return result is null
            ? ApiResult<T>.Failure("Response body was null.")
            : ApiResult<T>.Success(result);
    }
}
```

This layer is **internal**. Consumers never interact with it directly.

## Layer 3: Service — "What"

The Service layer is the public-facing API. It provides domain-meaningful methods with convenience overloads. Consumers inject `IWeatherService` and never think about HTTP.

```csharp
public interface IWeatherService
{
    Task<ApiResult<ListResponse<ForecastOutput>>> GetForecastsAsync(
        GetForecastsInput input, CancellationToken cancellationToken = default);

    Task<ApiResult<ListResponse<ForecastOutput>>> GetForecastsByCityAsync(
        string city, int? days = null, CancellationToken cancellationToken = default);

    Task<ApiResult<ForecastOutput>> GetForecastByIdAsync(
        Guid id, CancellationToken cancellationToken = default);

    Task<ApiResult<ListResponse<ForecastOutput>>> SearchForecastsAsync(
        SearchForecastsInput input, CancellationToken cancellationToken = default);
}
```

The implementation delegates everything to the internal HttpClient:

```csharp
internal sealed class WeatherService : IWeatherService
{
    private readonly IWeatherHttpClient _httpClient;

    public WeatherService(IWeatherHttpClient httpClient)
        => _httpClient = httpClient;

    public Task<ApiResult<ListResponse<ForecastOutput>>> GetForecastsByCityAsync(
        string city, int? days = null, CancellationToken cancellationToken = default)
        => _httpClient.GetForecastsAsync(city, days, cancellationToken);

    public Task<ApiResult<ForecastOutput>> GetForecastByIdAsync(
        Guid id, CancellationToken cancellationToken = default)
        => _httpClient.GetForecastByIdAsync(id, cancellationToken);
}
```

Notice the Service class itself is `internal` — only the `IWeatherService` interface is `public`. Consumers depend on the abstraction, not the implementation.

## Wiring It Up: DI + Resilience

A single extension method registers everything. The consumer's `Program.cs` has one line:

```csharp
builder.Services.AddWeatherApiClient(builder.Configuration);
```

Behind the scenes, this configures the typed HttpClient with `IHttpClientFactory`, sets up authentication, and adds a resilience pipeline (retry, circuit breaker, timeout):

```csharp
public static class ClientModule
{
    public static IServiceCollection AddWeatherApiClient(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var settings = new WeatherApiClientSettings();
        configuration.GetSection("WeatherApi").Bind(settings);

        services.AddHttpClient<IWeatherHttpClient, WeatherHttpClient>(client =>
            {
                client.BaseAddress = new Uri(settings.ServiceAddress);
                client.DefaultRequestHeaders
                    .Add("Authorization", $"ApiKey {settings.ApiKey}");
            })
            .AddResilienceHandler("weather-pipeline", (builder, _) =>
            {
                builder.AddRetry(new HttpRetryStrategyOptions
                {
                    MaxRetryAttempts = 3,
                    BackoffType = DelayBackoffType.Exponential,
                    UseJitter = true
                });
                builder.AddCircuitBreaker(new HttpCircuitBreakerStrategyOptions
                {
                    FailureRatio = 0.5,
                    SamplingDuration = TimeSpan.FromSeconds(30)
                });
                builder.AddTimeout(TimeSpan.FromSeconds(30));
            });

        services.AddSingleton<IWeatherService, WeatherService>();
        return services;
    }
}
```

## The Consumer's Experience

From the consumer's perspective, the SDK is dead simple:

```csharp
var weatherService = host.Services.GetRequiredService<IWeatherService>();

var result = await weatherService.GetForecastsByCityAsync("Brussels", days: 3);

if (result.IsSuccess)
{
    foreach (var forecast in result.Data!.Items)
        Console.WriteLine($"{forecast.Date}: {forecast.TemperatureC}C");
}
```

No `HttpClient`. No URLs. No JSON serialization. No retry logic. Just typed methods returning typed results.

## Why This Works

The three-layer split gives you clear boundaries for change:

- **API routes change?** Update `Endpoints` only.
- **Switching from JSON to Protobuf?** Update `HttpClient` only.
- **Need a new convenience method?** Add it to `Service` only.
- **Multiple API modules?** Each gets its own Endpoints/HttpClient/Service triplet with shared Core infrastructure.

It also makes testing straightforward. You can mock `IWeatherService` in consumer tests, or mock `IWeatherHttpClient` when testing the Service layer in isolation.

## Scaling to Multiple Modules

In a real system, you'll have multiple API modules. The pattern scales by repeating the three-layer structure per module, sharing a common Core:

```
Client/
  Core/                    # Shared: HttpClientBase, ApiResult, error handling
  Weather/                 # Module: Endpoints, HttpClient, Service
  Alerts/                  # Module: Endpoints, HttpClient, Service
  Users/                   # Module: Endpoints, HttpClient, Service
  ClientModule.cs          # Chains: ConfigureWeather -> ConfigureAlerts -> ConfigureUsers
```

Each module is self-contained. Adding a new one doesn't touch existing code.

## Demo Repository

I've put together a working demo solution that demonstrates this pattern with a Weather API and its typed client SDK:

**[GatewayPattern on GitHub](https://github.com/Tim-Maes/GatewayPattern)**

The solution contains three projects:
- **WeatherApi** — a minimal API with forecast and alert endpoints
- **WeatherApi.Client** — the typed client SDK implementing the three-layer Gateway Pattern
- **WeatherApi.Consumer** — a console app demonstrating SDK usage

---

*The Gateway Pattern isn't new, but this three-layer decomposition gives it the structure it needs to scale in real-world .NET systems. One responsibility per layer, one extension method to wire it all up, and zero HTTP knowledge required by consumers.*
