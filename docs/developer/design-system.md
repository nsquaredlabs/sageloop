# Sageloop Design System

**Modern, Clean, Fast**

Inspired by: Linear, Vercel, Stripe, Arc Browser

---

## Brand Identity

### Logo

The Sageloop logo consists of a **triangle inside a circle**, representing:

- **Circle (stroke)**: The "loop" - continuous iteration and evaluation cycles
- **Triangle (filled)**: Abstract wizard/expert element - domain expertise and insight

**Implementation**:

```tsx
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  <circle cx="12" cy="12" r="10" />
  <path d="M12 7L8 16h8L12 7z" fill="currentColor" stroke="none" />
</svg>
```

**Usage**:

- Primary: White on gray-900 background with rounded-lg container
- Size: 32x32px (8x8 Tailwind units) in navigation
- Padding: p-1.5 inside container
- Always paired with "Sageloop" wordmark in semibold

**Colors**:

- Dark theme: White logo on gray-900
- Light theme: Gray-900 logo on white (if needed)

---

## Philosophy

### Core Principles

1. **High Contrast** - Sharp blacks (#0a0a0a) and whites (#ffffff), minimal grays
2. **Single Accent** - One vibrant color (indigo #6366f1), used sparingly
3. **Generous Spacing** - Let content breathe, 24-32px between sections
4. **Clear Hierarchy** - Obvious size jumps, limited font weights (regular/semibold only)
5. **Subtle Motion** - Smooth, purposeful animations, nothing flashy

### What We Avoid

- No rainbow gradients everywhere
- No heavy shadows and depth effects
- No busy backgrounds with multiple patterns
- No more than two font weights (regular/semibold)
- No slow, bouncy animations

---

## Color System

### Monochrome Base

```css
Background:
  Primary:   #ffffff (white)
  Secondary: #fafafa (off-white)
  Tertiary:  #f5f5f5 (light gray)
  Inverse:   #0a0a0a (almost black)

Text:
  Primary:   #0a0a0a (almost black)
  Secondary: #6b7280 (gray-500)
  Tertiary:  #9ca3af (gray-400)
  Inverse:   #ffffff (white)

Borders:
  Primary:   #e5e7eb (gray-200)
  Secondary: #f3f4f6 (gray-100)
```

### Accent Color

```css
Accent:      #6366f1 (indigo-500)
Hover:       #4f46e5 (indigo-600)
Gradient:    linear-gradient(135deg, #6366f1, #8b5cf6)
```

**Usage Rule**: Use accent color for:

- Primary CTA buttons
- Links and interactive elements
- Key numbers/stats
- Hover states

**Don't use accent for**:

- Large backgrounds
- Multiple elements on same screen
- Body text (except links)

---

## Typography

### Font Family

- **Primary**: Inter (variable font)
- **Monospace**: JetBrains Mono (for code/terminal)

### Font Weights

Only use 2 weights:

- **Regular (400)**: Body text
- **Semibold (600)**: Headlines, emphasis

### Type Scale

```css
Display:  text-6xl (60px) - Hero headlines only
H1:       text-5xl (48px) - Section headlines
H2:       text-4xl (36px) - Subsections
H3:       text-2xl (24px) - Card titles
Body:     text-base (16px) - Default
Small:    text-sm (14px) - Captions, metadata
```

### Line Height

- Headlines: `leading-tight` (1.25)
- Body: `leading-relaxed` (1.625)

### Letter Spacing

- Headlines: `tracking-tight` (-0.025em)
- Body: default
- All caps: `tracking-wide` (0.025em)

---

## Spacing System

### Base Unit: 4px

Use Tailwind's spacing scale (4px increments):

- `space-2` = 8px
- `space-4` = 16px
- `space-6` = 24px
- `space-8` = 32px
- `space-12` = 48px
- `space-16` = 64px

### Common Patterns

```css
Section padding:    py-20 (80px) or py-24 (96px)
Card padding:       p-6 (24px) or p-8 (32px)
Button padding:     px-6 py-3 (24px horizontal, 12px vertical)
Container padding:  px-6 sm:px-8 lg:px-12
```

---

## Components

### Buttons

**Primary** (High emphasis):

```tsx
<button className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors">
  Save Changes
</button>
```

**Secondary** (Medium emphasis):

```tsx
<button className="px-6 py-3 bg-white border border-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
  Cancel
</button>
```

**Accent** (Call-to-action):

```tsx
<button className="px-6 py-3 gradient-accent text-white rounded-xl font-semibold hover:opacity-90 transition-opacity">
  Generate Outputs
</button>
```

### Cards

**Basic Card**:

```tsx
<div className="bg-white border border-gray-200 rounded-2xl p-6">Content</div>
```

**Hover Card**:

```tsx
<div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-lg transition-all">
  Content
</div>
```

### Badges

**Status Badge**:

```tsx
<span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
  Draft
</span>
```

**Accent Badge**:

```tsx
<span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold">
  Active
</span>
```

---

## Effects & Patterns

### Shadows

Use sparingly. Prefer borders over shadows.

```css
Subtle:   shadow-sm
Normal:   shadow-lg
Strong:   shadow-2xl
```

### Border Radius

```css
Small:    rounded-lg (8px)
Medium:   rounded-xl (12px)
Large:    rounded-2xl (16px)
Full:     rounded-full
```

### Transitions

All transitions should be **200-300ms** with ease-out:

```css
transition-colors duration-200
transition-all duration-300
```

### Background Patterns

**Dot Pattern** (preferred):

```tsx
<div className="dot-pattern">Content</div>
```

---

## Layout

### Container

```tsx
<div className="container-custom">
  {/* Max-width: 1152px, centered, responsive padding */}
</div>
```

### Grid Layouts

```tsx
{/* 2 columns on desktop */}
<div className="grid md:grid-cols-2 gap-8">

{/* 3 columns */}
<div className="grid md:grid-cols-3 gap-6">
```

### Responsive Breakpoints

```css
sm:  640px  (mobile landscape)
md:  768px  (tablet)
lg:  1024px (desktop)
xl:  1280px (large desktop)
```

---

## Animations

### Principles

1. **Subtle** - No bouncing, no spinning
2. **Fast** - 200-300ms max
3. **Purposeful** - Only animate for feedback or state change

### Examples

**Hover Scale**:

```tsx
<button className="hover:scale-105 transition-transform">
```

**Slide Up** (custom animation):

```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## Semantic Color Tokens

Defined in `app/globals.css` and `tailwind.config.ts`:

### Light Mode

```css
--background: 0 0% 100%; /* #ffffff */
--foreground: 0 0% 4%; /* #0a0a0a */
--primary: 239 84% 67%; /* #6366f1 - indigo-500 */
--primary-foreground: 0 0% 100%; /* #ffffff */
--secondary: 0 0% 96%; /* #f5f5f5 */
--muted: 0 0% 96%;
--muted-foreground: 220 9% 46%; /* #6b7280 */
--border: 220 13% 91%; /* #e5e7eb */
--ring: 239 84% 67%; /* Focus ring */
```

### Dark Mode

```css
--background: 0 0% 4%; /* #0a0a0a */
--foreground: 0 0% 100%; /* #ffffff */
--primary: 239 84% 70%; /* Lighter indigo */
--secondary: 0 0% 15%; /* #262626 */
--muted: 0 0% 15%;
--muted-foreground: 220 9% 62%; /* #9ca3af */
--border: 0 0% 20%;
```

### Utility Classes

```css
.gradient-accent {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.gradient-text {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## Icons

- **Style**: Outline (Heroicons)
- **Size**: `w-5 h-5` (20px) or `w-6 h-6` (24px)
- **Stroke width**: 2px
- **Color**: Match text color

---

## Accessibility

### Contrast Ratios

- Normal text: 4.5:1 minimum (WCAG AA)
- Our black (#0a0a0a) on white: 20:1 — well above requirement

### Focus States

```tsx
focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2
```

### Touch Targets

- Minimum: 44x44px
- Buttons: `py-3` achieves 48px height

### Semantic HTML

- Use `<button>` for actions
- Use `<a>` for navigation
- Maintain heading hierarchy (H1 → H2 → H3)

---

## Best Practices

**Do**:

- Use black (#0a0a0a) for primary text
- Use generous whitespace (24px+ between elements)
- Keep it monochrome with single indigo accent
- Use semibold for emphasis, regular for body
- Prefer borders over shadows
- Round corners (rounded-xl, rounded-2xl)
- Simple transitions (200-300ms)

**Don't**:

- Use text lighter than gray-500 on white backgrounds
- Use multiple gradients on the same page
- Use font weights other than 400 or 600
- Use heavy shadows
- Animate every interaction
- Use border-radius of 4px or less (looks dated)
