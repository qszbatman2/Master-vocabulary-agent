---
name: "ui-design-skill"
description: "Provides a modern UI design system with gradient styles, components, and page templates. Invoke when starting a new project or needing consistent UI patterns."
---

# Modern UI Design System

## Overview

This design system provides a modern, gradient-based UI framework that can be easily reused across projects. It includes:

- Complete color system with gradients
- Typography hierarchy
- UI components (buttons, cards, forms, etc.)
- Page templates (login, dashboard, settings)
- Interactive elements and animations

## Color System

### CSS Variables

```css
:root {
    --primary-gradient: linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff);
    --accent-gradient: linear-gradient(135deg, #00f0ff, #7c4dff);
    --success-gradient: linear-gradient(135deg, #00ff88, #00d4ff);
    --dark-bg: #12121e;
    --card-bg: #1e1e2e;
    --card-light: #ffffff;
    --text-primary: #ffffff;
    --text-secondary: #a0a0b0;
    --text-dark: #1a1a2e;
    --radius-lg: 24px;
    --radius-md: 16px;
    --radius-sm: 12px;
    --shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 10px 30px rgba(0, 0, 0, 0.2);
    --transition-fast: 0.2s ease;
    --transition-normal: 0.3s ease;
}
```

## Typography

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| Display | 56px | Bold | Hero sections |
| Heading 1 | 36px | Bold | Page titles |
| Heading 2 | 28px | Semibold | Section titles |
| Body | 16px | Regular | Main content |
| Small | 14px | Regular | Auxiliary text |

---

### 4. Animation & Interaction Best Practices

Based on real-world optimization experience:

#### Entry Animations

```css
/* Staggered fade-in with slide up */
.element {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.7s ease;
}

.element.loaded {
  opacity: 1;
  transform: translateY(0);
}

/* Use delay for staggered effect */
.card-1 { transition-delay: 100ms; }
.card-2 { transition-delay: 200ms; }
.card-3 { transition-delay: 300ms; }
```

#### Hover Effects

```css
/* Card lift + scale + glow */
.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 0 30px rgba(255, 107, 157, 0.3);
}

/* Icon scale on hover */
.card:hover .icon {
  transform: scale(1.1);
}
```

#### Click Feedback

```css
/* Button press effect */
.btn {
  transition: all 0.2s ease;
}

.btn:active {
  transform: scale(0.95);
}
```

#### Subtle Animations

```css
/* Pulse breathing effect */
.pulse-icon {
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Background glow pulse */
.bg-glow {
  animation: bgPulse 4s ease-in-out infinite;
}

@keyframes bgPulse {
  0%, 100% { opacity: 0.25; }
  50% { opacity: 0.35; }
}
```

### 5. Visual Layering

#### Background Depth

```css
/* Grid texture overlay */
.bg-grid {
  background-image: 
    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* Gradient orbs */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  /* Use gradient colors from primary/accent/success */
}
```

#### Card Glow Effect

```css
/* Edge glow on hover */
.card-glow {
  position: relative;
}

.card-glow::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 
    0 0 30px rgba(0, 240, 255, 0.3),
    inset 0 0 30px rgba(0, 240, 255, 0.05);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card-glow:hover::after {
  opacity: 1;
}
```

### 6. Performance Optimization

#### Animation Performance Rules

1. **Use only transform and opacity** for animations
2. **Avoid reflow triggers**: width, height, top, left, margin, padding
3. **Use will-change sparingly** only for complex animations
4. **Prefer CSS over JS** for animations when possible

```css
/* Good - GPU accelerated */
.optimized {
  transition: transform 0.3s, opacity 0.3s;
}

/* Bad - Triggers reflow */
.avoid {
  transition: width 0.3s, height 0.3s;
}
```

### 7. Component States

#### Stat Cards with Color Coding

```html
<div class="stat-card success">
  <div class="stat-icon">
    <CheckCircle />
  </div>
  <div class="stat-value">1,234</div>
  <div class="stat-label">Mastered</div>
</div>

<style>
.stat-card.success {
  background: rgba(0, 255, 136, 0.08);
}

.stat-card.success .stat-icon,
.stat-card.success .stat-value {
  color: #00ff88;
}

.stat-card.warning {
  background: rgba(255, 107, 157, 0.08);
}

.stat-card.info {
  background: rgba(0, 240, 255, 0.08);
}
</style>
```

#### Progress Bar Animation

```html
<div class="progress-wrapper">
  <div class="progress-bar" style="width: 75%"></div>
</div>

<style>
.progress-wrapper {
  height: 10px;
  background: rgba(255,255,255,0.05);
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(135deg, #00ff88, #00d4ff);
  border-radius: 999px;
  transition: width 1s ease-out;
}
</style>
```

### 8. Optimization Checklist

#### Visual Design
- [ ] Deep background color (#12121e)
- [ ] Card background with contrast (#1e1e2e)
- [ ] Consistent gradient direction (135deg)
- [ ] Large border radius (24px for cards)
- [ ] Soft shadows (0 10px 40px rgba(0,0,0,0.3))

#### Interaction
- [ ] Entry animation (fade + slide up)
- [ ] Hover feedback (lift + scale)
- [ ] Click feedback (scale down)
- [ ] Loading states (skeleton or spinner)

#### Performance
- [ ] Use CSS transforms only
- [ ] Avoid layout thrashing
- [ ] Lazy load images
- [ ] Debounce scroll handlers

#### Accessibility
- [ ] Sufficient color contrast (WCAG AA)
- [ ] Focus visible states
- [ ] Keyboard navigation
- [ ] ARIA labels for icons

### 9. React/Next.js Implementation

```tsx
'use client';

import { useState, useEffect } from 'react';

export default function AnimatedCard() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div
      className="card transition-all duration-700"
      style={{
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: '200ms'
      }}
    >
      {/* Card content */}
    </div>
  );
}
```

### 10. Common Patterns

#### Gradient Text

```css
.gradient-text {
  background: linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

#### Gradient Button

```css
.btn-gradient {
  background: linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  transition: all 0.2s ease;
}

.btn-gradient:hover {
  transform: scale(1.05);
}

.btn-gradient:active {
  transform: scale(0.95);
}
```

#### Icon Badge

```css
.icon-badge {
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #ff6b9d, #c44cff);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.icon-badge:hover {
  transform: scale(1.1);
}
```

### Buttons

```html
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
<button class="btn btn-ghost">Ghost Button</button>
```

### Cards

```html
<div class="card">
    <!-- Card content -->
</div>

<div class="card card-light">
    <!-- Light card content -->
</div>
```

### Inputs

```html
<input type="text" class="input" placeholder="Enter text...">
```

### Toggles

```html
<div class="toggle active"></div> <!-- On -->
<div class="toggle"></div> <!-- Off -->
```

## Page Templates

### 1. Login Page

```html
<div class="login-card">
    <div class="logo">
        <div class="logo-icon"></div>
    </div>
    <h1 class="login-title">Welcome Back</h1>
    <p class="login-subtitle">Sign in to continue</p>
    
    <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" class="input" placeholder="your@email.com">
    </div>
    
    <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" class="input" placeholder="••••••••">
    </div>
    
    <button class="btn btn-primary login-btn">Sign In</button>
</div>
```

### 2. Dashboard Page

```html
<div class="dashboard-wrapper">
    <aside class="sidebar">
        <div class="sidebar-logo">
            <div class="logo"></div>
            <span class="sidebar-logo-text">App Name</span>
        </div>
        <ul class="nav-menu">
            <li class="nav-item active">
                <div class="nav-icon"></div>
                <span>Dashboard</span>
            </li>
            <!-- More menu items -->
        </ul>
    </aside>
    
    <main class="main-content">
        <div class="dashboard-header">
            <div>
                <h1 class="header-title">Hello, User 👋</h1>
                <p>Here's your dashboard</p>
            </div>
            <div class="header-actions">
                <input type="text" class="search-bar" placeholder="Search...">
                <button class="btn btn-primary">+ New</button>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Users</div>
                <div class="stat-value">12,486</div>
                <div class="stat-change">+12.5%</div>
            </div>
            <!-- More stats -->
        </div>
        
        <div class="content-grid">
            <div class="chart-card">
                <div class="card-header">
                    <h3 class="card-title">Data Trends</h3>
                    <button class="btn btn-ghost">Week</button>
                </div>
                <div class="chart-placeholder">📊 Chart</div>
            </div>
            <!-- More content -->
        </div>
    </main>
</div>
```

### 3. Settings Page

```html
<div class="profile-wrapper">
    <div class="profile-header">
        <div class="profile-avatar"></div>
        <h1 class="profile-name">User Name</h1>
        <p class="profile-role">Role</p>
        <div class="profile-badges">
            <span class="badge">Badge</span>
        </div>
    </div>
    
    <div class="settings-grid">
        <div class="settings-card">
            <h3 class="settings-section-title">Personal Info</h3>
            <!-- Form fields -->
        </div>
        
        <div class="settings-card">
            <h3 class="settings-section-title">Preferences</h3>
            <div class="setting-item">
                <div class="setting-info">
                    <div class="setting-name">Dark Mode</div>
                    <div class="setting-desc">Use dark theme</div>
                </div>
                <div class="toggle active"></div>
            </div>
            <!-- More settings -->
        </div>
    </div>
</div>
```

## Complete Implementation

### Full CSS

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary-gradient: linear-gradient(135deg, #ff6b9d, #c44cff, #4cc9ff);
    --accent-gradient: linear-gradient(135deg, #00f0ff, #7c4dff);
    --success-gradient: linear-gradient(135deg, #00ff88, #00d4ff);
    --dark-bg: #12121e;
    --card-bg: #1e1e2e;
    --card-light: #ffffff;
    --text-primary: #ffffff;
    --text-secondary: #a0a0b0;
    --text-dark: #1a1a2e;
    --radius-lg: 24px;
    --radius-md: 16px;
    --radius-sm: 12px;
    --shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 10px 30px rgba(0, 0, 0, 0.2);
    --transition-fast: 0.2s ease;
    --transition-normal: 0.3s ease;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--dark-bg);
    color: var(--text-primary);
    overflow-x: hidden;
}

.gradient-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background: linear-gradient(135deg, #12121e 0%, #1a1a2e 50%, #12121e 100%);
}

.gradient-orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.5;
    z-index: -1;
}

.orb-1 {
    width: 600px;
    height: 600px;
    background: #ff6b9d;
    top: -200px;
    right: -100px;
}

.orb-2 {
    width: 500px;
    height: 500px;
    background: #7c4dff;
    bottom: -150px;
    left: -100px;
}

.orb-3 {
    width: 400px;
    height: 400px;
    background: #00d4ff;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.btn {
    padding: 14px 32px;
    border-radius: 50px;
    border: none;
    cursor: pointer;
    font-weight: 600;
    font-size: 15px;
    transition: var(--transition-normal);
    display: inline-block;
}

.btn-primary {
    background: var(--primary-gradient);
    color: white;
}

.btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(196, 76, 255, 0.4);
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.2);
}

.btn-ghost {
    background: transparent;
    color: white;
}

.btn-ghost:hover {
    background: rgba(255, 255, 255, 0.1);
}

.card {
    background: var(--card-bg);
    border-radius: var(--radius-lg);
    padding: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.card-light {
    background: var(--card-light);
    color: var(--text-dark);
}

.input {
    width: 100%;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-md);
    color: white;
    font-size: 15px;
    transition: var(--transition-fast);
}

.input:focus {
    outline: none;
    border-color: #7c4dff;
    box-shadow: 0 0 0 3px rgba(124, 77, 255, 0.2);
}

.toggle {
    width: 60px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50px;
    position: relative;
    cursor: pointer;
    transition: var(--transition-fast);
}

.toggle.active {
    background: var(--primary-gradient);
}

.toggle::after {
    content: '';
    position: absolute;
    width: 26px;
    height: 26px;
    background: white;
    border-radius: 50%;
    top: 3px;
    left: 3px;
    transition: var(--transition-fast);
}

.toggle.active::after {
    left: 31px;
}

/* Page-specific styles */
.login-wrapper {
    display: flex;
    min-height: 100vh;
    align-items: center;
    justify-content: center;
}

.login-card {
    background: rgba(30, 30, 46, 0.95);
    border-radius: 32px;
    padding: 60px;
    width: 100%;
    max-width: 480px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: var(--shadow-lg);
    backdrop-filter: blur(20px);
}

.dashboard-wrapper {
    display: flex;
    min-height: 100vh;
}

.sidebar {
    width: 280px;
    background: rgba(30, 30, 46, 0.9);
    padding: 30px 20px;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.main-content {
    flex: 1;
    padding: 40px;
    overflow-y: auto;
}

.profile-wrapper {
    max-width: 900px;
    margin: 0 auto;
    padding: 60px 20px;
}

/* Additional components */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 24px;
    margin-bottom: 30px;
}

.stat-card {
    background: rgba(30, 30, 46, 0.8);
    border-radius: var(--radius-lg);
    padding: 28px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.content-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
}

.settings-grid {
    display: grid;
    gap: 24px;
}

.settings-card {
    background: rgba(30, 30, 46, 0.8);
    border-radius: var(--radius-lg);
    padding: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.setting-item:last-child {
    border-bottom: none;
}
```

## Usage Instructions

1. **Copy the CSS** into your project's stylesheet
2. **Use the HTML templates** for your pages
3. **Customize** the colors, typography, and content as needed
4. **Add the gradient orbs** for the background effect
5. **Implement the JavaScript** for interactive elements (toggles, navigation)

## JavaScript for Interactivity

```javascript
// Toggle functionality
document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', function() {
        this.classList.toggle('active');
    });
});

// Navigation (if needed)
function showPage(index) {
    const pages = document.querySelectorAll('.page');
    const navBtns = document.querySelectorAll('.nav-btn');
    
    pages.forEach((page, i) => {
        page.classList.toggle('active', i === index);
    });
    
    navBtns.forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });
}
```

## Design Principles

1. **Clear Hierarchy**: Use color, size, and spacing to create visual hierarchy
2. **Modern Gradients**: Use smooth gradients for visual appeal
3. **Soft Rounded Corners**: Consistent border radius system (12-24px)
4. **Micro-interactions**: Smooth transitions (0.2-0.3s) for enhanced UX
5. **Layered Design**: Use background orbs and blur effects for depth

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Backdrop-filter may not work in older browsers
- Gradients and transitions are widely supported

## Performance Tips

- Use CSS variables for consistent theming
- Optimize images and assets
- Consider lazy loading for heavy components
- Minify CSS for production

This design system provides a complete, modern UI framework that can be easily adapted to any project while maintaining visual consistency.