# Code Block Styling Test

This document demonstrates the improved syntax highlighting across different languages.

## C# Example

```csharp
public class UserService : IUserService
{
    private readonly IRepository<User> _repository;
    private readonly ILogger<UserService> _logger;

    public UserService(IRepository<User> repository, ILogger<UserService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<UserDto> GetUserAsync(int id)
    {
        var user = await _repository.GetByIdAsync(id);
        if (user == null)
        {
            _logger.LogWarning("User with ID {UserId} not found", id);
            throw new NotFoundException($"User {id} not found");
        }

        return user.ToFacet<UserDto>();
    }
}
```

## JavaScript Example

```javascript
async function fetchUserData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const userData = await response.json();
        return userData;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}
```

## JSON Example

```json
{
  "name": "Tim Maes",
  "role": "Software Developer",
  "skills": ["C#", ".NET", "JavaScript", "React"],
  "github": "https://github.com/Tim-Maes",
  "active": true,
  "yearsExperience": 5
}
```

## Bash/Shell Example

```bash
#!/bin/bash

# Deploy script
APP_NAME="myapp"
VERSION="1.0.0"

echo "Deploying ${APP_NAME} version ${VERSION}..."

docker build -t ${APP_NAME}:${VERSION} .
docker push ${APP_NAME}:${VERSION}

echo "Deployment complete!"
```

## SQL Example

```sql
SELECT 
    u.Id,
    u.FirstName,
    u.LastName,
    COUNT(o.Id) AS OrderCount,
    SUM(o.TotalAmount) AS TotalSpent
FROM Users u
LEFT JOIN Orders o ON u.Id = o.UserId
WHERE u.IsActive = 1
    AND u.CreatedAt >= '2024-01-01'
GROUP BY u.Id, u.FirstName, u.LastName
HAVING COUNT(o.Id) > 5
ORDER BY TotalSpent DESC;
```

## Inline Code

You can also use `inline code` within your paragraphs. For example, the `ToFacet<T>()` method is used for mapping.

## Features Implemented

? **Dark theme** for better readability
? **Syntax colors** for different language elements
? **Line numbers** (when enabled in config)
? **Proper sizing** and spacing
? **Responsive design** for mobile devices
? **Smooth scrolling** for wide code blocks
? **Distinct inline code** styling

## How to Use

1. Wrap code blocks in triple backticks with language identifier:
   ````markdown
   ```csharp
   // Your C# code here
   ```
   ````

2. For inline code, use single backticks: `` `code` ``

3. Line numbers are automatically added based on your `_config.yml` settings
