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

- ❌ Rainbow gradients everywhere
- ❌ Heavy shadows and depth effects
- ❌ Busy backgrounds with multiple patterns
- ❌ Too many font weights (light/medium/bold/black)
- ❌ Slow, bouncy animations

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
- Text (except links)

---

## Typography

### Font Family

- **Primary**: Inter (variable font)
- **Monospace**: JetBrains Mono (for code/terminal)

### Font Weights

Only use 2 weights:

- **Regular (400)**: Body text
- **Semibold (600)**: Headlines, emphasis

**Why**: Too many weights creates visual noise. Semibold is bolder than medium but not as heavy as bold.

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

### Vertical Rhythm

- Between sections: 80-120px (`py-20` to `py-32`)
- Within sections: 24-48px (`space-6` to `space-12`)
- Between elements: 16-24px (`space-4` to `space-6`)

---

## Components

### Buttons

**Primary** (High emphasis):

```tsx
<button className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors">
  Start Free
</button>
```

**Secondary** (Medium emphasis):

```tsx
<button className="px-6 py-3 bg-white border border-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
  Learn More
</button>
```

**Accent** (Call-to-action):

```tsx
<Link
  href="/signup"
  className="px-6 py-3 gradient-accent text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
>
  Get Started
</Link>
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

**Glass Card** (for dark backgrounds):

```tsx
<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
  Content
</div>
```

### Badges

**Status Badge**:

```tsx
<span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
  New
</span>
```

**Accent Badge**:

```tsx
<span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold">
  Featured
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

**Grid Pattern**:

```tsx
<div className="grid-pattern">Content</div>
```

**Noise Texture** (subtle depth):

```tsx
<div className="noise">Content</div>
```

---

## Layout

### Container

```tsx
<div className="container-custom">
  {/* Max-width: 1152px (6xl), centered, responsive padding */}
</div>
```

### Grid Layouts

```tsx
{/* 2 columns on desktop */}
<div className="grid md:grid-cols-2 gap-8">

{/* 3 columns */}
<div className="grid md:grid-cols-3 gap-6">

{/* 4 columns */}
<div className="grid md:grid-cols-4 gap-4">
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

**Fade In**:

```tsx
<div className="animate-slide-up">
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

## Imagery

### Product Screenshots

- **Format**: WebP with PNG fallback
- **Quality**: 85%
- **Max width**: 1920px
- **Lazy load**: Yes
- **Border**: 1px solid gray-200
- **Shadow**: None or subtle shadow-lg

### Icons

- **Style**: Outline (Heroicons)
- **Size**: w-5 h-5 (20px) or w-6 h-6 (24px)
- **Stroke width**: 2px
- **Color**: Match text color

---

## Best Practices

### Do ✓

- Use black (#0a0a0a) for primary text
- Use generous whitespace (24px+ between elements)
- Keep it monochrome with single accent
- Use semibold for emphasis, regular for body
- Prefer borders over shadows
- Round corners (rounded-xl, rounded-2xl)
- Simple, fast transitions (200-300ms)

### Don't ✗

- Don't use light gray text on white (#6b7280 minimum)
- Don't use multiple gradients on same page
- Don't use font weights other than 400/600
- Don't use heavy shadows
- Don't animate everything
- Don't use small border radius (4px looks dated)

---

## Examples from Modern Sites

### Linear

- High contrast black/white
- Single purple accent
- Generous spacing
- Clean typography
- Subtle animations

### Vercel

- Monochrome with black accent
- Dot pattern backgrounds
- Sharp corners vs rounded
- Minimal shadows
- Fast, crisp interactions

### Stripe

- Clean white backgrounds
- Single blue accent
- Clear typography hierarchy
- Purposeful animations
- Professional, minimal

### Arc Browser

- Bold gradients (but used sparingly)
- High contrast
- Modern rounded corners
- Smooth transitions
- Glass morphism effects

---

## Component Library Reference

```tsx
// Primary CTA
<button className="btn-primary">Action</button>

// Secondary CTA
<button className="btn-secondary">Learn More</button>

// Card
<div className="card">Content</div>

// Hover Card
<div className="card-hover">Content</div>

// Container
<div className="container-custom">Content</div>

// Grid 2-col
<div className="grid md:grid-cols-2 gap-8">Content</div>

// Accent Text
<span className="gradient-text">Highlighted</span>

// Background Pattern
<div className="dot-pattern">Content</div>
```

---

## Mobile Considerations

### Touch Targets

- Minimum: 44x44px
- Buttons: `py-3` (48px height)
- Links: Add padding for larger tap area

### Font Sizes

- Never below 14px (text-sm)
- Body text: 16px (text-base)
- Small text: 14px (text-sm)

### Spacing

- Reduce section padding: `py-16` on mobile vs `py-24` on desktop
- Maintain minimum 16px gutters

---

## Accessibility

### Contrast Ratios

- Large text (24px+): 3:1 minimum
- Normal text: 4.5:1 minimum
- Our black (#0a0a0a) on white: 20:1 ✓

### Focus States

```tsx
focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2
```

### Semantic HTML

- Use `<button>` for actions
- Use `<a>` for navigation
- Use proper heading hierarchy (H1 → H2 → H3)

---

## Performance

### CSS

- Use Tailwind utilities (tree-shaken)
- Minimize custom CSS
- No unused fonts or weights

### Animations

- Use CSS transforms (GPU accelerated)
- Avoid animating width/height
- Prefer opacity, transform, filter

### Images

- WebP format
- Lazy loading
- Responsive sizes
- CDN delivery

---

## Tools & Resources

- **Fonts**: [Inter](https://rsms.me/inter/) (variable font)
- **Icons**: [Heroicons](https://heroicons.com)
- **Colors**: Tailwind gray scale + indigo
- **Gradients**: [UI Gradients](https://uigradients.com) (use sparingly)
- **Shadows**: Tailwind shadow utilities
- **Patterns**: CSS-only (dot-pattern, grid-pattern)

---

## Implementation Notes

### Color System - Actual HSL Values (Sprint 0)

**Implemented**: December 15, 2025
**Files**: `app/globals.css`, `tailwind.config.ts`

#### Light Mode

```css
/* Monochrome Base */
--background: 0 0% 100%; /* #ffffff - white */
--foreground: 0 0% 4%; /* #0a0a0a - almost black */
--card: 0 0% 100%; /* #ffffff - white */
--card-foreground: 0 0% 4%; /* #0a0a0a - almost black */

/* Accent Color - Indigo */
--primary: 239 84% 67%; /* #6366f1 - indigo-500 */
--primary-foreground: 0 0% 100%; /* #ffffff - white */

/* Secondary/Muted - Light grays */
--secondary: 0 0% 96%; /* #f5f5f5 - light gray */
--secondary-foreground: 0 0% 4%; /* #0a0a0a - almost black */
--muted: 0 0% 96%; /* #f5f5f5 - light gray */
--muted-foreground: 220 9% 46%; /* #6b7280 - gray-500 */

/* Accent (same as primary) */
--accent: 239 84% 67%; /* #6366f1 - indigo-500 */
--accent-foreground: 0 0% 100%; /* #ffffff - white */

/* Borders */
--border: 220 13% 91%; /* #e5e7eb - gray-200 */
--input: 220 13% 91%; /* #e5e7eb - gray-200 */
--ring: 239 84% 67%; /* #6366f1 - indigo-500 (focus ring) */
```

#### Dark Mode

```css
/* Dark Mode - High contrast */
--background: 0 0% 4%; /* #0a0a0a - almost black */
--foreground: 0 0% 100%; /* #ffffff - white */

/* Accent Color - Lighter indigo for dark bg */
--primary: 239 84% 70%; /* Lighter indigo for dark bg */
--primary-foreground: 0 0% 4%; /* #0a0a0a - almost black */

/* Secondary/Muted - Dark grays */
--secondary: 0 0% 15%; /* #262626 - dark gray */
--muted: 0 0% 15%; /* #262626 - dark gray */
--muted-foreground: 220 9% 62%; /* #9ca3af - gray-400 */

/* Borders - Subtle in dark mode */
--border: 0 0% 20%; /* #333333 - dark border */
--input: 0 0% 20%; /* #333333 - dark border */
```

#### Utility Classes

```css
/* Gradient Accent - For CTA buttons and highlights */
.gradient-accent {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

/* Gradient Text - For highlighted text */
.gradient-text {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Text Balance - Better headline wrapping */
.text-balance {
  text-wrap: balance;
}
```

#### Tailwind Extensions

```typescript
// tailwind.config.ts additions
primary: {
  DEFAULT: "hsl(var(--primary))",
  foreground: "hsl(var(--primary-foreground))",
  hover: "239 84% 60%", // indigo-600 for hover states
}
accent: {
  DEFAULT: "hsl(var(--accent))",
  foreground: "hsl(var(--accent-foreground))",
  hover: "239 84% 60%", // indigo-600 for hover states
}
```

**Migration Status**: ✅ Complete
**Contrast Ratios**: ✅ WCAG AA compliant (20:1 for primary text)
**Build Status**: ✅ No errors or warnings

---

## Version

**v1.0** - December 2025
**Status**: Production Ready

**Implementation Progress**:

- ✅ Color System (Sprint 0 - December 15, 2025)
- ⏳ Logo Component (Sprint 1 - Planned)
- ⏳ Typography (Future)
- ⏳ Spacing & Layout (Future)
- ⏳ Component Patterns (Future)
