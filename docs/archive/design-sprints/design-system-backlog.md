# Design System - Future Work Backlog

**Last Updated**: December 15, 2025
**Status**: Post-Sprint 2 (Colors + Logo Complete)

---

## Overview

This document tracks remaining design system work beyond the initial implementation (Sprints 0-2). The foundation is complete: color system, logo component, and documentation. Future sprints will refine typography, spacing, components, and effects.

**Completed**:

- ✅ Color System (Sprint 0)
- ✅ Logo Component (Sprint 1)
- ✅ Documentation & Polish (Sprint 2)

**Remaining Work**: ~40-60 hours estimated

---

## Sprint 3: Typography Enhancement

**Goal**: Load Inter variable font and refine typography throughout the application.

**Priority**: 🟡 High
**Estimated Effort**: 8-12 hours
**Impact**: High visual quality improvement

### Tasks

1. **Load Inter Variable Font** (2h)
   - Add Inter from Google Fonts or self-host
   - Update `app/globals.css` body font-family
   - Configure font-display: swap for performance
   - Test loading performance

2. **Update Typography Scale** (2h)
   - Verify all heading sizes match design system
   - Ensure consistent font-weight usage (400/600 only)
   - Update any remaining medium/light weights
   - Add `tracking-tight` to large headings

3. **Refine Line Heights** (2h)
   - Headlines: `leading-tight` (1.25)
   - Body: `leading-relaxed` (1.625)
   - Audit all text for proper line-height

4. **Add Text Balance** (1h)
   - Apply `text-balance` to main headlines
   - Test headline wrapping on mobile
   - Ensure readability

5. **Visual QA** (2h)
   - Test all pages with new font
   - Verify mobile/tablet/desktop rendering
   - Check font loading states (FOUT/FOIT)
   - Measure performance impact

6. **Documentation** (1h)
   - Update DESIGN_SYSTEM.md with font loading notes
   - Add performance metrics
   - Document any fallback strategy

### Files Affected

- `app/globals.css` - Font family
- `app/layout.tsx` - Font loader (if using next/font)
- All pages - Visual verification

### Success Metrics

- [ ] Inter font loads correctly
- [ ] No font-weight outside 400/600
- [ ] Consistent line-heights
- [ ] Performance: LCP < 2.5s
- [ ] No layout shift on font load

---

## Sprint 4: Spacing & Layout Refinement

**Goal**: Implement generous spacing and improve layout consistency.

**Priority**: 🟢 Medium
**Estimated Effort**: 10-14 hours
**Impact**: Medium - improves visual breathing room

### Tasks

1. **Audit Current Spacing** (3h)
   - Document all spacing patterns in use
   - Identify inconsistencies
   - Map to design system spacing scale

2. **Update Section Spacing** (3h)
   - Sections: `py-20` or `py-24` (80-96px)
   - Reduce on mobile: `py-16 md:py-24`
   - Add vertical rhythm documentation

3. **Update Card/Component Spacing** (3h)
   - Cards: `p-6` or `p-8` (24-32px)
   - Forms: `space-y-6` for field groups
   - Lists: `space-y-4` for items

4. **Container Improvements** (2h)
   - Consistent max-width (1152px / 6xl)
   - Responsive padding: `px-6 sm:px-8 lg:px-12`
   - Centered containers

5. **Visual QA & Adjustments** (2h)
   - Test on all screen sizes
   - Verify spacing feels generous
   - Check mobile experience

6. **Documentation** (1h)
   - Update spacing guidelines in CLAUDE.md
   - Add spacing decision rationale

### Files Affected

- Multiple component files
- Page layouts
- Card components

### Success Metrics

- [ ] Consistent spacing throughout
- [ ] Generous whitespace (not cramped)
- [ ] Mobile spacing appropriate
- [ ] Documentation updated

---

## Sprint 5: Component Pattern Updates

**Goal**: Refine button, card, and badge styles to match design system perfectly.

**Priority**: 🟢 Medium
**Estimated Effort**: 12-16 hours
**Impact**: High polish, premium feel

### Tasks

1. **Button Refinements** (4h)
   - Review all button variants
   - Ensure hover states are smooth (200-300ms)
   - Test focus states (indigo ring)
   - Add subtle scale on hover (hover:scale-105)?
   - Verify disabled states

2. **Card Refinements** (4h)
   - Review border styles (should be subtle)
   - Test hover states on interactive cards
   - Ensure consistent padding
   - Add shadow on hover for interactive cards?

3. **Badge/Chip Updates** (2h)
   - Verify badge colors use semantic tokens
   - Ensure consistent sizing
   - Test in different contexts

4. **Input/Form Components** (3h)
   - Ensure focus states use indigo
   - Test border contrast
   - Verify error states are clear
   - Check disabled styles

5. **Visual QA** (2h)
   - Test all components across pages
   - Verify consistency
   - Check interactions feel snappy

6. **Documentation** (1h)
   - Update component examples in CLAUDE.md
   - Document any new patterns

### Files Affected

- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/badge.tsx`
- `components/ui/input.tsx`
- Other form components

### Success Metrics

- [ ] All components use design system colors
- [ ] Consistent hover/focus states
- [ ] Smooth transitions (200-300ms)
- [ ] Professional, polished feel
- [ ] No visual bugs

---

## Sprint 6: Effects & Motion

**Goal**: Add subtle animations, transitions, and background patterns.

**Priority**: 🟢 Low-Medium
**Estimated Effort**: 8-12 hours
**Impact**: Premium polish, delight

### Tasks

1. **Transition Audit** (2h)
   - Identify all interactive elements
   - Ensure consistent timing (200-300ms)
   - Use `transition-colors` or `transition-all`

2. **Hover Effects** (3h)
   - Cards: subtle shadow or border change
   - Buttons: smooth color transition
   - Links: underline or opacity change
   - Logo: scale or opacity on hover?

3. **Loading States** (2h)
   - Skeleton loaders for async content
   - Smooth fade-in for loaded content
   - Progress indicators for long operations

4. **Background Patterns** (2h)
   - Implement dot pattern (optional)
   - Add noise texture for depth (optional)
   - Test on landing page / hero sections

5. **Page Transitions** (2h)
   - Fade in on page load (optional)
   - Smooth scroll behavior
   - Route change indicators

6. **Documentation** (1h)
   - Document animation patterns
   - Add performance notes
   - Update design system with motion specs

### Files Affected

- `app/globals.css` - Animation keyframes
- `tailwind.config.ts` - Animation utilities
- Various components for hover states

### Success Metrics

- [ ] Consistent 200-300ms transitions
- [ ] No janky animations
- [ ] GPU-accelerated (transform, opacity)
- [ ] Feels responsive and snappy
- [ ] Optional patterns don't hurt performance

---

## Sprint 7: Landing Page Redesign

**Goal**: Apply design system to landing page for premium first impression.

**Priority**: 🟡 High (for public launch)
**Estimated Effort**: 12-16 hours
**Impact**: Very High - first impression

### Tasks

1. **Hero Section** (4h)
   - Large headline with `text-balance`
   - Indigo CTA with gradient-accent
   - High contrast text
   - Logo prominently displayed
   - Generous spacing

2. **Feature Sections** (4h)
   - Clean card layouts
   - Icon + headline + description pattern
   - Consistent spacing
   - Subtle hover effects

3. **Social Proof** (2h)
   - Testimonials or stats
   - Clean, minimal design
   - Uses muted colors for subtlety

4. **Footer** (2h)
   - Logo + navigation links
   - Consistent spacing
   - Dark background option?

5. **Visual QA** (3h)
   - Test all breakpoints
   - Verify colors and contrast
   - Check interactions
   - Performance audit

6. **Documentation** (1h)
   - Document landing page patterns
   - Add screenshots to design system

### Files Affected

- `app/page.tsx` - Landing page
- New components for landing features

### Success Metrics

- [ ] Premium, professional appearance
- [ ] Clear hierarchy and flow
- [ ] Fast loading (< 2s LCP)
- [ ] Mobile-friendly
- [ ] Matches design system perfectly

---

## Sprint 8: Dark Mode Refinement

**Goal**: Perfect dark mode experience across the application.

**Priority**: 🟢 Low-Medium
**Estimated Effort**: 6-10 hours
**Impact**: Medium - for users who prefer dark mode

### Tasks

1. **Color Audit** (2h)
   - Test all pages in dark mode
   - Identify any contrast issues
   - Document problem areas

2. **Color Adjustments** (3h)
   - Fine-tune dark mode colors in globals.css
   - Adjust borders for visibility
   - Ensure indigo primary is visible

3. **Component Testing** (2h)
   - Test all UI components
   - Verify cards, buttons, inputs work well
   - Check focus states are visible

4. **Add Dark Mode Toggle** (2h)
   - Create theme switcher component
   - Add to user menu or settings
   - Persist preference in localStorage

5. **Documentation** (1h)
   - Update design system with dark mode notes
   - Document toggle implementation

### Files Affected

- `app/globals.css` - Dark mode colors
- New theme switcher component
- User preferences logic

### Success Metrics

- [ ] All pages look good in dark mode
- [ ] Sufficient contrast (WCAG AA)
- [ ] Easy to toggle between modes
- [ ] Preference persists
- [ ] No visual bugs

---

## Future Enhancements (No Sprint Assigned)

These are ideas for later, not prioritized:

### Advanced Typography

- Add JetBrains Mono for code blocks
- Implement better code syntax highlighting
- Add pull quotes or callouts

### Microinteractions

- Button ripple effect on click
- Toast notification animations
- Drawer/modal slide-in effects

### Accessibility Improvements

- High contrast mode
- Reduced motion mode
- Focus trap improvements

### Performance

- Optimize font loading further
- Add resource hints (preload, prefetch)
- Image optimization

### Branding

- Favicon variations
- Social media preview images (og:image)
- Email templates with design system

---

## Priority Summary

| Sprint                 | Priority   | Effort | Impact    | Recommended Order  |
| ---------------------- | ---------- | ------ | --------- | ------------------ |
| Sprint 3: Typography   | 🟡 High    | 8-12h  | High      | 1st (foundation)   |
| Sprint 7: Landing Page | 🟡 High    | 12-16h | Very High | 2nd (public face)  |
| Sprint 4: Spacing      | 🟢 Medium  | 10-14h | Medium    | 3rd (polish)       |
| Sprint 5: Components   | 🟢 Medium  | 12-16h | High      | 4th (refinement)   |
| Sprint 8: Dark Mode    | 🟢 Low-Med | 6-10h  | Medium    | 5th (nice-to-have) |
| Sprint 6: Effects      | 🟢 Low-Med | 8-12h  | Medium    | 6th (delight)      |

**Total Estimated**: 56-80 hours

---

## Notes & Considerations

### Typography (Sprint 3)

- **Why First**: Font is foundation for all text, affects everything
- **Risk**: Font loading can impact performance - test thoroughly
- **Alternative**: Could use system fonts indefinitely (acceptable)

### Landing Page (Sprint 7)

- **Why Second**: Public-facing, high impact for new users
- **Dependency**: Benefits from typography being done first
- **Could Skip**: If focusing on authenticated user experience only

### Spacing (Sprint 4)

- **When**: After typography is set (affects vertical rhythm)
- **Impact**: Makes app feel more premium and less cramped
- **Quick Wins**: Can do incrementally as you touch each page

### Components (Sprint 5)

- **When**: After spacing (spacing affects component design)
- **Detail Work**: Lots of small refinements, takes time
- **High ROI**: Makes every page look better

### Dark Mode (Sprint 8)

- **Optional**: Not critical for MVP
- **User Demand**: Implement if users request it
- **Easy Toggle**: Already supported, just needs refinement

### Effects (Sprint 6)

- **Polish**: Last layer of refinement
- **Optional**: Can ship without these
- **Delight Factor**: Makes app feel premium, but not essential

---

## Decision Framework

**Should I do this sprint?**

Questions to ask:

1. Does it block other work? (e.g., typography blocks landing page)
2. Is it user-facing and high-impact? (e.g., landing page)
3. Does it improve core functionality? (e.g., component refinements)
4. Can it wait until after launch? (e.g., dark mode, effects)

**Minimum for Launch**:

- ✅ Sprint 0: Colors (DONE)
- ✅ Sprint 1: Logo (DONE)
- ✅ Sprint 2: Polish (DONE)
- 🟡 Sprint 3: Typography (Recommended)
- 🟡 Sprint 7: Landing Page (If public-facing)

**Everything Else**: Post-launch polish

---

## Sprint Templates

When starting a future sprint, create:

1. `docs/design-sprint-X-plan.md` - Detailed plan
2. `docs/design-sprint-X-summary.md` - Completion summary
3. Update `docs/design-system-implementation-plan.md` - Overall progress

---

**Last Updated**: December 15, 2025 by Claude Code
**Status**: Backlog Ready
**Next Recommended Sprint**: Sprint 3 (Typography)
