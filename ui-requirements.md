# Ari - UI Requirements and Asset Generation Guide

## Table of Contents
1. [App Icons](#app-icons)
2. [Splash Screen Assets](#splash-screen-assets)
3. [Web Assets](#web-assets)
4. [UI Assets](#ui-assets)
5. [Feature Icons](#feature-icons)
6. [Notification Icons](#notification-icons)
7. [Tab Bar Icons](#tab-bar-icons)
8. [Loading States](#loading-states)
9. [Empty State Illustrations](#empty-state-illustrations)
10. [Background Patterns](#background-patterns)
11. [App Store Assets](#app-store-assets)
12. [Play Store Assets](#play-store-assets)
13. [Asset Optimization Guidelines](#asset-optimization-guidelines)

## App Icons

### Main App Icon (`icon.png`)
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Color Space**: sRGB
- **Background**: Transparent
- **Style Guidelines**:
  - Use a simple, recognizable design
  - Ensure the icon is legible at small sizes
  - Maintain consistent branding colors
  - Test the icon at various sizes (16px to 1024px)
- **Generation Instructions**:
  1. Start with a 1024x1024 canvas
  2. Create the main design in the center 80% of the canvas
  3. Export with transparency
  4. Test at various sizes to ensure clarity

### Adaptive Icon (`adaptive-icon.png`)
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Color Space**: sRGB
- **Style Guidelines**:
  - Design should work with different Android shapes
  - Keep important elements in the center 66% of the icon
  - Use transparent background
- **Generation Instructions**:
  1. Create a 1024x1024 canvas
  2. Design the icon within the center 66% (676x676 pixels)
  3. Export with transparency
  4. Test on different Android devices

## Splash Screen Assets

### Splash Icon (`splash-icon.png`)
- **Size**: 1242x2436 pixels (iPhone X and newer)
- **Format**: PNG with transparency
- **Color Space**: sRGB
- **Background**: White (#FFFFFF)
- **Style Guidelines**:
  - Center the logo
  - Use consistent branding
  - Keep the design simple and clean
- **Generation Instructions**:
  1. Create a 1242x2436 canvas with white background
  2. Place the logo in the center
  3. Add any additional branding elements
  4. Export as PNG

## Web Assets

### Favicon (`favicon.png`)
- **Size**: 32x32 pixels
- **Format**: PNG
- **Color Space**: sRGB
- **Style Guidelines**:
  - Simple, recognizable design
  - Works well at small sizes
- **Generation Instructions**:
  1. Create a 32x32 canvas
  2. Design a simplified version of the logo
  3. Export as PNG

## UI Assets

### Logo (`logo.png`)
- **Size**: 120x120 pixels
- **Format**: PNG with transparency
- **Color Space**: sRGB
- **Style Guidelines**:
  - Professional and modern design
  - Consistent with app branding
  - Works well on light and dark backgrounds
- **Generation Instructions**:
  1. Create a 120x120 canvas
  2. Design the logo with transparency
  3. Test on both light and dark backgrounds
  4. Export as PNG

### Profile Avatar Placeholder
- **Size**: 80x80 pixels
- **Format**: PNG with transparency
- **Color Space**: sRGB
- **Style Guidelines**:
  - Simple, professional design
  - Works well with user initials
- **Generation Instructions**:
  1. Create an 80x80 canvas
  2. Design a circular placeholder
  3. Include space for initials
  4. Export as PNG with transparency

## Feature Icons

### Financial Category Icons
- **Size**: 24x24 pixels
- **Format**: PNG with transparency
- **Color Space**: sRGB
- **Required Icons**:
  - Income (cash)
  - Expenses (cash-minus)
  - Goals (flag)
  - Budget
  - Savings
  - Investment
  - Debt
  - Reports
- **Style Guidelines**:
  - Consistent stroke width (2px)
  - Clear, recognizable symbols
  - Works well at small sizes
- **Generation Instructions**:
  1. Create a 24x24 canvas
  2. Use a 2px stroke width
  3. Design each icon with transparency
  4. Test at actual size
  5. Export as PNG

## Notification Icons

### Status Icons
- **Size**: 24x24 pixels
- **Format**: PNG with transparency
- **Color Space**: sRGB
- **Required Icons**:
  - Alert
  - Success
  - Warning
  - Info
- **Style Guidelines**:
  - Consistent design language
  - Clear meaning at small sizes
  - Works with different background colors
- **Generation Instructions**:
  1. Create a 24x24 canvas
  2. Design each icon with transparency
  3. Test on different backgrounds
  4. Export as PNG

## Tab Bar Icons

### Navigation Icons
- **Size**: 24x24 pixels (both states)
- **Format**: PNG with transparency
- **Color Space**: sRGB
- **Required Icons**:
  - Home (active/inactive)
  - Transactions (active/inactive)
  - Budget (active/inactive)
  - Profile (active/inactive)
  - Insights (active/inactive)
- **Style Guidelines**:
  - Consistent design across states
  - Clear difference between active/inactive
  - Works well at small sizes
- **Generation Instructions**:
  1. Create 24x24 canvas for each state
  2. Design active state with filled style
  3. Design inactive state with outline style
  4. Test both states together
  5. Export as PNG

## Loading States

### Loading Animation
- **Format**: Lottie JSON or GIF
- **Size**: 48x48 pixels
- **Duration**: 1-2 seconds
- **Style Guidelines**:
  - Smooth animation
  - Consistent with app theme
  - Lightweight
- **Generation Instructions**:
  1. Create animation in After Effects
  2. Export as Lottie JSON
  3. Optimize for size
  4. Test on different devices

## Empty State Illustrations

### Empty State Graphics
- **Size**: 200x200 pixels
- **Format**: PNG with transparency
- **Color Space**: sRGB
- **Required Illustrations**:
  - No transactions
  - No budget set
  - No goals set
  - No insights available
- **Style Guidelines**:
  - Friendly and approachable
  - Consistent illustration style
  - Works on light and dark themes
- **Generation Instructions**:
  1. Create 200x200 canvas
  2. Design each illustration
  3. Test on both themes
  4. Export as PNG

## Background Patterns

### Pattern Assets
- **Format**: PNG or SVG
- **Size**: 200x200 pixels (repeating)
- **Style Guidelines**:
  - Very subtle design
  - Light colors
  - Seamless repeat
- **Generation Instructions**:
  1. Create 200x200 canvas
  2. Design subtle pattern
  3. Test repeat
  4. Export as PNG or SVG

## App Store Assets

### Screenshots
- **Required Sizes**:
  - iPhone 6.7" (1290x2796 pixels)
  - iPhone 6.5" (1242x2688 pixels)
  - iPhone 5.5" (1242x2208 pixels)
  - iPad Pro 12.9" (2048x2732 pixels)
- **Format**: PNG
- **Style Guidelines**:
  - Show key features
  - Include device frames
  - Consistent branding
- **Generation Instructions**:
  1. Create templates for each size
  2. Capture screenshots
  3. Add device frames
  4. Export as PNG

## Play Store Assets

### Store Graphics
- **Required Sizes**:
  - Feature Graphic (1024x500 pixels)
  - TV Banner (1280x720 pixels)
  - Screenshots:
    - Phone (1080x1920 pixels)
    - 7" Tablet (1200x1920 pixels)
    - 10" Tablet (1920x1200 pixels)
- **Format**: PNG
- **Style Guidelines**:
  - Consistent branding
  - Clear feature presentation
  - Works on different devices
- **Generation Instructions**:
  1. Create templates for each size
  2. Design graphics
  3. Test on different devices
  4. Export as PNG

## Asset Optimization Guidelines

### General Optimization Rules
1. **PNG Optimization**:
   - Use `pngquant` for lossy compression
   - Use `optipng` for lossless compression
   - Target file size: < 100KB for large images

2. **SVG Optimization**:
   - Use `svgo` for optimization
   - Remove unnecessary metadata
   - Simplify paths where possible

3. **Lottie Optimization**:
   - Remove unused layers
   - Simplify animations
   - Target file size: < 50KB

4. **Testing Requirements**:
   - Test on multiple devices
   - Verify light/dark theme compatibility
   - Check loading performance
   - Validate accessibility

5. **Export Checklist**:
   - [ ] Correct size and format
   - [ ] Proper color space
   - [ ] Transparency where needed
   - [ ] Optimized file size
   - [ ] Tested on target devices
   - [ ] Verified in app context

### Color Guidelines
- Primary: #2196F3
- Secondary: #03DAC6
- Error: #B00020
- Success: #4CAF50
- Warning: #FFC107
- Background: #F5F5F5
- Surface: #FFFFFF
- Text: #000000
- Disabled: #757575
- Placeholder: #9E9E9E
- Backdrop: rgba(0, 0, 0, 0.5)
- Notification: #FF4081

### Naming Conventions
- Use lowercase letters
- Use hyphens for spaces
- Include size in filename
- Example: `icon-24.png`, `logo-120.png`

### File Organization
```
assets/
  ├── icons/
  │   ├── feature/
  │   ├── notification/
  │   └── tab/
  ├── images/
  │   ├── empty-states/
  │   └── backgrounds/
  ├── animations/
  └── store/
      ├── app-store/
      └── play-store/
``` 