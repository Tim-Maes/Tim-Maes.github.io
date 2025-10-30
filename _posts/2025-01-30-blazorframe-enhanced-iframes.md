---
layout: post
title: "BlazorFrame: Enhanced iframes for Blazor"
date: 2025-01-30 12:00:00 +0000
tags: [blazor, security, components, csharp, dotnet]
---

Building secure Blazor applications requires careful consideration of how we handle external content. While iframes are sometimes necessary, they can introduce security vulnerabilities if not properly configured. That's why I created **BlazorFrame** - a security-first iframe component for Blazor applications.

## The Problem with Traditional iframes

Standard iframe elements in web applications often lack proper security controls:

```html
<!-- Basic iframe - not secure enough -->
<iframe src="https://external-site.com"></iframe>
```

This simple approach exposes your application to several security risks:
- **Cross-site scripting (XSS)** attacks
- **Clickjacking** vulnerabilities
- **Data leakage** between contexts
- **Unauthorized script execution**

## Introducing BlazorFrame

BlazorFrame is a Blazor component that wraps iframes with enterprise-grade security features:

### Key Features

- **Advanced Security** - Built-in XSS and clickjacking protection
- **CSP Integration** - Content Security Policy compliance
- **Real-time Monitoring** - Track iframe lifecycle and security events
- **High Performance** - Optimized rendering with minimal overhead
- **Origin Validation** - Whitelist trusted domains
- **Sandbox Controls** - Fine-grained permission management

## Getting Started

### Installation

```bash
dotnet add package BlazorFrame
```

### Basic Usage

```razor
@using BlazorFrame

<BlazorFrame 
    Source="https://trusted-site.com"
    AllowedOrigins="@(new[] { "https://trusted-site.com" })"
    Sandbox="@SandboxFlags.AllowScripts"
    OnLoad="HandleFrameLoaded"
    OnError="HandleFrameError" />

@code {
    private void HandleFrameLoaded()
    {
        // Frame loaded successfully
        Console.WriteLine("Frame loaded securely");
    }

    private void HandleFrameError(string error)
    {
        // Handle loading errors
        Console.WriteLine($"Error loading frame: {error}");
    }
}
```

## Advanced Configuration

### Sandbox Permissions

Control exactly what the iframe can do:

```razor
<BlazorFrame 
    Source="https://external-content.com"
    Sandbox="@(SandboxFlags.AllowScripts | 
               SandboxFlags.AllowSameOrigin | 
               SandboxFlags.AllowForms)" />
```

Available sandbox flags:
- `AllowScripts` - Allow JavaScript execution
- `AllowSameOrigin` - Treat content as same origin
- `AllowForms` - Allow form submission
- `AllowPopups` - Allow popups
- `AllowPointerLock` - Allow pointer lock API
- `AllowTopNavigation` - Allow top-level navigation

### CSP Integration

Integrate with your Content Security Policy:

```razor
<BlazorFrame 
    Source="https://analytics.example.com"
    CspPolicy="default-src 'self'; script-src 'self' https://trusted-cdn.com"
    ReferrerPolicy="no-referrer" />
```

### Origin Validation

Whitelist trusted domains:

```razor
<BlazorFrame 
    Source="https://api.example.com/embed"
    AllowedOrigins="@allowedOrigins"
    OnOriginViolation="HandleOriginViolation" />

@code {
    private string[] allowedOrigins = new[]
    {
        "https://api.example.com",
        "https://cdn.example.com"
    };

    private void HandleOriginViolation(string origin)
    {
        _logger.LogWarning($"Blocked content from unauthorized origin: {origin}");
    }
}
```

## Real-time Monitoring

Track iframe lifecycle and security events:

```razor
<BlazorFrame 
    Source="@embedUrl"
    EnableMonitoring="true"
    OnSecurityEvent="HandleSecurityEvent"
    OnPerformanceMetric="HandlePerformance" />

@code {
    private void HandleSecurityEvent(SecurityEvent evt)
    {
        switch (evt.Type)
        {
            case SecurityEventType.OriginMismatch:
                _logger.LogWarning($"Origin mismatch detected: {evt.Details}");
                break;
            case SecurityEventType.SandboxViolation:
                _logger.LogError($"Sandbox violation: {evt.Details}");
                break;
            case SecurityEventType.CspViolation:
                _logger.LogError($"CSP violation: {evt.Details}");
                break;
        }
    }

    private void HandlePerformance(PerformanceMetric metric)
    {
        Console.WriteLine($"Load time: {metric.LoadTime}ms");
    }
}
```

## Use Cases

### Embedding Third-Party Content

```razor
<BlazorFrame 
    Source="https://youtube.com/embed/VIDEO_ID"
    AllowedOrigins="@(new[] { "https://youtube.com", "https://www.youtube.com" })"
    Sandbox="@(SandboxFlags.AllowScripts | SandboxFlags.AllowSameOrigin)"
    Title="Embedded Video"
    Width="560"
    Height="315" />
```

### Payment Gateway Integration

```razor
<BlazorFrame 
    Source="@paymentGatewayUrl"
    AllowedOrigins="@(new[] { "https://secure-payment.com" })"
    Sandbox="@(SandboxFlags.AllowScripts | 
               SandboxFlags.AllowForms | 
               SandboxFlags.AllowSameOrigin)"
    EnableMonitoring="true"
    OnMessage="HandlePaymentMessage" />

@code {
    private void HandlePaymentMessage(FrameMessage message)
    {
        if (message.Origin == "https://secure-payment.com")
        {
            // Process payment result
            ProcessPayment(message.Data);
        }
    }
}
```

### Analytics Dashboards

```razor
<BlazorFrame 
    Source="https://analytics.example.com/dashboard"
    AllowedOrigins="@(new[] { "https://analytics.example.com" })"
    Sandbox="@SandboxFlags.AllowScripts"
    CspPolicy="default-src 'self' https://analytics.example.com"
    Loading="lazy" />
```

## Security Best Practices

1. **Always Specify Allowed Origins** - Never use wildcard origins in production
2. **Minimal Sandbox Permissions** - Only enable required permissions
3. **Enable Monitoring** - Track security events in production
4. **Use HTTPS** - Always use secure connections
5. **Implement CSP** - Define strict Content Security Policies
6. **Validate Messages** - Always verify origin of postMessage communications

## Architecture

BlazorFrame is built on top of standard HTML iframe elements but adds:

- **Compile-time safety** through C# type checking
- **Runtime validation** of security policies
- **Event-driven architecture** for monitoring
- **Performance optimization** through lazy loading
- **Framework integration** with Blazor lifecycle

## Conclusion

BlazorFrame demonstrates that security and developer experience don't have to be mutually exclusive. By providing sensible defaults and powerful configuration options, it makes building secure Blazor applications easier while maintaining flexibility for advanced scenarios.

Whether you're embedding third-party content, integrating payment gateways, or building complex dashboards, BlazorFrame provides the security and monitoring tools you need.

## Resources

- **BlazorFrame on GitHub:** [https://github.com/Tim-Maes/BlazorFrame](https://github.com/Tim-Maes/BlazorFrame)
- **BlazorFrame on NuGet:** [https://www.nuget.org/packages/BlazorFrame](https://www.nuget.org/packages/BlazorFrame)

---

*Building secure Blazor applications? Check out my other posts on .NET security and Blazor development!*
