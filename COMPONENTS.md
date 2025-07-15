# Reusable Components System

This project now uses a reusable component system for header and footer sections across all pages.

## Structure

```
/
??? components/
?   ??? header.html     # Reusable header component
?   ??? footer.html     # Reusable footer component
??? js/
?   ??? components.js   # Component loader utility
??? index.html          # Homepage using components
??? blog.html          # Blog page using components
??? styles.css         # Existing styles
```

## How It Works

1. **Component Files**: Header and footer HTML is stored in separate files in the `components/` directory
2. **Component Loader**: The `js/components.js` file provides a `ComponentLoader` class that:
   - Fetches component HTML via AJAX
   - Injects components into placeholder divs
   - Initializes functionality (navigation, mobile menu, etc.)
   - Sets active navigation states based on current page

## Usage

### For New Pages

1. Add placeholder divs in your HTML:
```html
<!-- Header Placeholder -->
<div id="header-placeholder"></div>

<!-- Your page content here -->

<!-- Footer Placeholder -->
<div id="footer-placeholder"></div>
```

2. Include the component loader script:
```html
<script src="js/components.js"></script>
```

### Updating Components

To update the header or footer across all pages:
1. Edit `components/header.html` or `components/footer.html`
2. Changes will automatically apply to all pages using the components

## Features

- **Automatic Navigation**: Active nav links are set based on current page
- **Mobile Menu**: Hamburger menu functionality is automatically initialized
- **Scroll Effects**: Header scroll effects are handled automatically
- **Smooth Scrolling**: Anchor link smooth scrolling is enabled
- **Error Handling**: Graceful fallback if components fail to load

## Benefits

- **DRY Principle**: No more duplicate header/footer code
- **Easy Maintenance**: Update once, applies everywhere
- **Consistent Navigation**: Automatic active state management
- **SEO Friendly**: Works with static HTML hosting (GitHub Pages, etc.)
- **No Build Process**: Pure HTML/CSS/JS solution