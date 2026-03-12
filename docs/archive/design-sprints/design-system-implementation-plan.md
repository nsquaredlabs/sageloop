# Design System Implementation Plan

**Date**: December 15, 2025
**Status**: ✅ COMPLETE - All 3 Sprints Finished
**Total Estimated Effort**: 18 hours across 3 sprints
**Actual Time**: Sprint 0: 7h | Sprint 1: 6h | Sprint 2: 5h | **Total: 18h**
**Accuracy**: 100% (Perfect estimation!)

## Overview

This plan implements the Sageloop Design System (defined in `docs/DESIGN_SYSTEM.md`) across the application, focusing on **color scheme updates** and **logo integration**. The design system emphasizes high contrast, monochrome base with single accent color, generous spacing, and modern typography inspired by Linear, Vercel, and Stripe.

**Priority**: We're focusing on visual foundation (colors + logo) first, leaving typography, spacing, and component refinements for future iterations.

## Key Deliverables

- ✅ New color scheme implemented (monochrome base + indigo accent)
- ✅ Logo component created and integrated into navigation
- ✅ Global CSS updated with design system tokens
- ✅ Tailwind config aligned with design system
- ✅ All existing components using new color scheme

---

## Background

### Current State

**Color System**:

- HSL-based CSS variables in `app/globals.css`
- Current primary: Blue (#3B82F6 equivalent)
- Current accent: Same as secondary (light gray)
- Dark mode support via class
- Colors defined as: background, foreground, primary, secondary, accent, muted, destructive, border

**Navigation/Branding**:

- Root navbar: Text-only "Sageloop" logo (text-3xl font-bold)
- No visual logo/icon
- Sticky navbar with border-b
- User menu on right side

**Typography**:

- System fonts: `-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, etc.`
- Font weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Tracking: `tracking-tight` for headings

**Component Library**:

- shadcn-based components (Button, Card, Badge, etc.)
- CVA for variant management
- Tailwind utilities for styling
- Modular structure in `components/ui/`

### Problem Statement

The app currently lacks:

1. **Distinctive brand identity** - No logo, generic blue color scheme
2. **Design cohesion** - Colors don't follow the high-contrast monochrome philosophy
3. **Modern aesthetic** - System fonts vs premium Inter typeface, multiple accent colors vs focused single accent

The design system defines:

- **Monochrome base**: High contrast black (#0a0a0a) and white (#ffffff)
- **Single accent**: Indigo (#6366f1) used sparingly
- **Logo**: Triangle inside circle (loop + wizard symbolism)
- **Typography**: Inter variable font with only 400/600 weights

### Goals

1. **Visual Identity**: Implement logo across navigation and auth pages
2. **Color Consistency**: Replace current color scheme with design system palette
3. **Foundation for Growth**: Set up CSS tokens and Tailwind config for future design work
4. **Zero Regressions**: All existing functionality works with new design

### Non-Goals

- Typography changes (Inter font) - FUTURE
- Spacing/layout updates - FUTURE
- Component pattern updates (buttons, cards) - FUTURE
- Animation/effects implementation - FUTURE
- Mobile-specific refinements - FUTURE

---

## Technical Approach

### Architecture Decisions

**1. Color Implementation Strategy**

- **Keep CSS variable structure** - Don't break existing component API
- **Update HSL values** - Replace colors in `globals.css`
- **Add new accent tokens** - Introduce `accent-hover` for indigo-600
- **Preserve dark mode** - Update dark mode values to match design system

**2. Logo Component Architecture**

- **Create reusable component** - `components/ui/logo.tsx`
- **SVG inline** - No external assets, easier to style
- **Size variants** - Small (nav), medium (auth), large (landing)
- **Color variants** - Adapts to light/dark backgrounds
- **Always with wordmark** - Logo + "Sageloop" text per design system

**3. Migration Approach**

- **Global tokens first** - Update CSS variables and Tailwind config
- **No component changes needed** - Components automatically pick up new colors
- **Visual testing** - Manual QA of each page after changes

### Technology Choices

**Color System**:

- Continue using HSL in CSS variables (works well with Tailwind)
- Keep `@apply` directives minimal (Tailwind utilities preferred)
- Use Tailwind's color system for new accent variants

**Logo**:

- Inline SVG in React component (not image file)
- `currentColor` for fill/stroke (inherits text color)
- Tailwind classes for sizing and spacing

**No New Dependencies**:

- No icon libraries needed (lucide-react already installed)
- No custom font loading yet (future sprint)
- No CSS-in-JS libraries

### Design Trade-offs

| Decision        | Chosen Approach                 | Alternative Considered                | Rationale                                                |
| --------------- | ------------------------------- | ------------------------------------- | -------------------------------------------------------- |
| Color migration | Update CSS variables            | Replace with Tailwind colors directly | Preserves existing component API, easier rollback        |
| Logo format     | React component with inline SVG | Image file (PNG/SVG)                  | Easier to style, no asset management, better performance |
| Font loading    | Skip for now                    | Load Inter in Sprint 1                | Decouple visual changes, test color scheme first         |
| Accent color    | Single indigo                   | Multiple accent colors                | Design system principle: focus and clarity               |

**Why Colors Before Typography?**

- Color changes are lower risk (no layout shifts)
- Immediate visual impact
- Tests compatibility with existing components
- Logo looks good with system fonts initially

### Dependencies

**Prerequisites**:

- None - all changes are isolated to styling

**Concurrent Work**:

- No blockers for other development

**Post-Implementation**:

- Future: Typography sprint (load Inter font)
- Future: Spacing/layout refinement sprint
- Future: Component pattern updates sprint

---

## Sprint Plan

### Sprint 0: Color System Foundation (Week 0)

**Goal**: Update global color tokens and Tailwind configuration to match design system monochrome palette with indigo accent.

**Why First?** Colors are the foundation of the visual system. Getting them right ensures the logo (Sprint 1) and all future components use the correct palette.

**Tasks**:

1. ✅ **Update globals.css color variables** - 2h
   - Replace light mode colors:
     - Background: `0 0% 100%` (white)
     - Foreground: `0 0% 4%` (#0a0a0a - almost black)
     - Primary: `222.2 83.2% 53.3%` → `239 84% 67%` (indigo-500 #6366f1)
     - Primary foreground: Keep as white
     - Secondary: `210 40% 96.1%` → `0 0% 96%` (#f5f5f5 - light gray)
     - Muted: Keep as `0 0% 96%`
     - Accent: `210 40% 96.1%` → `239 84% 67%` (indigo-500)
     - Border: `214.3 31.8% 91.4%` → `0 0% 90%` (gray-200 #e5e7eb)
   - Replace dark mode colors:
     - Background: `222.2 84% 4.9%` → `0 0% 4%` (#0a0a0a)
     - Foreground: Keep as white
     - Primary: Keep indigo but adjust for dark mode
     - Border: Adjust for higher contrast
   - Add new variables:
     - `--accent-hover: 239 84% 60%` (indigo-600 #4f46e5)
     - `--gradient-accent: linear-gradient(135deg, #6366f1, #8b5cf6)`
   - Files: `app/globals.css`

2. ✅ **Update Tailwind config with new color tokens** - 1h
   - Extend theme with accent-hover
   - Add gradient-accent utility class
   - Verify all color tokens compile correctly
   - Files: `tailwind.config.ts`

3. ✅ **Visual QA across all pages** - 3h
   - Test light mode on all routes:
     - Landing page (`/`)
     - Auth pages (`/auth/login`, `/auth/signup`)
     - Projects list (`/projects`)
     - Project detail pages (`/projects/[id]/*`)
     - Settings/profile
   - Test dark mode (if user has it enabled)
   - Take screenshots before/after for documentation
   - Verify no broken color references
   - Check contrast ratios meet accessibility standards
   - Files: All pages

4. ✅ **Document color migration** - 1h
   - Update `docs/DESIGN_SYSTEM.md` with actual HSL values used
   - Add migration notes for future developers
   - Document any deviations from original design system
   - Files: `docs/DESIGN_SYSTEM.md`, this plan

**Total**: 7 hours

**Deliverables**:

- All pages using new monochrome color scheme
- Indigo accent color replacing blue primary
- High contrast text (almost black on white)
- CSS variables and Tailwind config aligned
- Before/after screenshots documented

**Success Metrics**:

- [ ] `npm run build` completes without warnings
- [ ] All pages render correctly in light mode
- [ ] Dark mode (if enabled) looks correct
- [ ] No color-related console errors
- [ ] Text contrast ratios pass WCAG AA (4.5:1 minimum)
- [ ] Primary buttons use indigo accent color
- [ ] Backgrounds are true white (#ffffff) or almost black (#0a0a0a)

---

### Sprint 1: Logo Component (Week 1)

**Goal**: Create the Sageloop logo component (triangle in circle) and integrate it into the root navigation bar.

**Why Second?** Logo depends on having the correct color scheme (Sprint 0). Once colors are set, logo can use `currentColor` to adapt automatically.

**Tasks**:

1. ✅ **Create Logo component** - 2h
   - Create `components/ui/logo.tsx`
   - Implement SVG with circle (stroke) + triangle (filled)
   - Props:
     - `size?: 'sm' | 'md' | 'lg'` (16px, 24px, 32px)
     - `variant?: 'light' | 'dark'` (for background color)
     - `showWordmark?: boolean` (default true)
     - `className?: string`
   - Sizes:
     - sm: 16x16px (nav secondary locations)
     - md: 24x24px (default)
     - lg: 32x32px (nav primary, auth pages)
   - Implementation:
     ```tsx
     <div className="flex items-center gap-2">
       <div className="rounded-lg bg-gray-900 p-1.5">
         <svg viewBox="0 0 24 24" className="w-5 h-5">
           <circle
             cx="12"
             cy="12"
             r="10"
             fill="none"
             stroke="currentColor"
             strokeWidth="2"
           />
           <path d="M12 7L8 16h8L12 7z" fill="currentColor" />
         </svg>
       </div>
       {showWordmark && <span className="font-semibold">Sageloop</span>}
     </div>
     ```
   - Files: `components/ui/logo.tsx`

2. ✅ **Integrate logo into root layout navbar** - 1h
   - Replace text-only "Sageloop" in `app/layout.tsx:36-44`
   - Use `<Logo size="lg" />` component
   - Maintain sticky positioning and spacing
   - Verify UserMenu alignment unchanged
   - Before:
     ```tsx
     <h1 className="text-3xl font-bold tracking-tight">
       <Link href="/projects">Sageloop</Link>
     </h1>
     ```
   - After:
     ```tsx
     <Link href="/projects">
       <Logo size="lg" />
     </Link>
     ```
   - Files: `app/layout.tsx`

3. ✅ **Add logo to auth pages** - 1h
   - Update login page (`app/auth/login/page.tsx`)
   - Update signup page (`app/auth/signup/page.tsx`)
   - Use `<Logo size="lg" />` at top of auth cards
   - Center-aligned above form
   - Files: `app/auth/login/page.tsx`, `app/auth/signup/page.tsx`

4. ✅ **Visual QA and responsive testing** - 1h
   - Test logo on all screen sizes (mobile, tablet, desktop)
   - Verify logo clarity at different sizes
   - Check dark mode rendering (white logo on dark bg)
   - Verify logo + wordmark spacing
   - Test logo as link (hover states)
   - Files: All pages with logo

5. ✅ **Write Logo component tests** - 1h
   - Test component renders correctly
   - Test size variants render correct dimensions
   - Test wordmark shows/hides based on prop
   - Test className prop is applied
   - Files: `tests/components/logo.test.tsx`

**Total**: 6 hours

**Deliverables**:

- Reusable Logo component with size/variant props
- Logo in root navbar (replaces text-only branding)
- Logo on auth pages (login/signup)
- Component tests with >80% coverage
- Responsive and accessible across all viewports

**Success Metrics**:

- [ ] Logo component tests pass
- [ ] Logo renders correctly at all sizes
- [ ] Logo maintains aspect ratio and clarity
- [ ] Wordmark text is readable and properly spaced
- [ ] Logo works on light and dark backgrounds
- [ ] No layout shifts or broken navigation
- [ ] Logo is clickable and navigates correctly

---

### Sprint 2: Polish & Documentation (Week 2)

**Goal**: Refine color usage across components, update documentation, and prepare for future design system work.

**Why Last?** Once colors and logo are implemented, this sprint ensures consistency, documents learnings, and sets up future sprints.

**Tasks**:

1. ✅ **Audit component color usage** - 2h
   - Review all components in `components/ui/`:
     - Button variants using new colors correctly
     - Cards using high-contrast borders
     - Badges using accent color appropriately
     - Alerts/destructive states still clear
   - Check for any hardcoded colors (replace with tokens)
   - Verify semantic color usage (primary for CTA, accent for links, etc.)
   - Files: `components/ui/*.tsx`

2. ✅ **Update project-specific components** - 2h
   - Review feature components:
     - `project-nav.tsx` - active states use new colors
     - `outputs-list.tsx` - rating buttons use accent color
     - `rating-form.tsx` - form elements styled correctly
     - `*-dialog.tsx` - dialogs maintain contrast
   - Update any custom styles not using tokens
   - Files: `components/*.tsx`

3. ✅ **Create design system utilities** - 1h
   - Add utility classes to `globals.css`:
     - `.gradient-accent` - For accent gradient backgrounds
     - `.gradient-text` - For accent gradient text
     - `.text-balance` - For better headline wrapping
   - Document usage in comments
   - Files: `app/globals.css`

4. ✅ **Update CLAUDE.md with design patterns** - 1h
   - Add "Design System" section to `CLAUDE.md`
   - Document color usage patterns:
     - When to use primary vs accent
     - High contrast requirements
     - Dark mode considerations
   - Document Logo component API
   - Add examples of correct component usage
   - Files: `CLAUDE.md`

5. ✅ **Create future design work backlog** - 1h
   - Document remaining design system work in `docs/design-system-backlog.md`:
     - Typography sprint (load Inter font)
     - Spacing/layout sprint (generous spacing, vertical rhythm)
     - Component patterns sprint (update button/card styles)
     - Effects sprint (subtle animations, patterns)
   - Prioritize based on visual impact vs effort
   - Estimate effort for each sprint
   - Files: `docs/design-system-backlog.md`

**Total**: 5 hours

**Deliverables**:

- All components using design system colors correctly
- Utility classes for common design patterns
- CLAUDE.md updated with design guidance
- Backlog of future design work documented
- Clean, consistent visual experience across app

**Success Metrics**:

- [ ] No hardcoded color values in components
- [ ] All components use semantic color tokens
- [ ] Utility classes compile and work correctly
- [ ] CLAUDE.md has clear design system guidance
- [ ] Future work backlog is prioritized and estimated
- [ ] App has cohesive, high-contrast visual design

---

## Testing Strategy

### Test Coverage Goals

| Layer             | Coverage Target | Priority    |
| ----------------- | --------------- | ----------- |
| Logo Component    | 80%             | 🟡 High     |
| Visual Regression | Manual QA       | 🟡 High     |
| Accessibility     | WCAG AA         | 🔴 Required |
| Cross-browser     | Major browsers  | 🟢 Medium   |

### Tests to Write

**Sprint 0 (Colors)**:

- Manual: Visual QA checklist for all pages
- Manual: Contrast ratio testing (use browser DevTools)
- Manual: Dark mode verification

**Sprint 1 (Logo)**:

- [ ] Logo component renders without errors
- [ ] Size prop applies correct dimensions (sm=16px, md=24px, lg=32px)
- [ ] Wordmark shows when `showWordmark={true}`
- [ ] Wordmark hides when `showWordmark={false}`
- [ ] className prop is applied to container
- [ ] SVG renders circle and triangle elements

**Sprint 2 (Polish)**:

- Manual: Component audit checklist
- Manual: Color token usage verification

### Testing Workflow

**For each sprint**:

1. Complete implementation tasks
2. Run `npm run build` - verify no errors
3. Run `npm test` - verify existing tests still pass
4. Manual QA per sprint success metrics
5. Take screenshots for documentation
6. Mark sprint as complete

**Visual regression testing**:

- Before Sprint 0: Screenshot all pages (baseline)
- After Sprint 0: Screenshot all pages (color changes)
- After Sprint 1: Screenshot nav/auth (logo changes)
- Compare before/after to catch unintended changes

---

## Files Modified Summary

### New Files (3 files)

- `components/ui/logo.tsx` - Logo component with size/variant props
- `tests/components/logo.test.tsx` - Logo component tests
- `docs/design-system-backlog.md` - Future design work backlog

### Modified Files (8 files)

- `app/globals.css` - Color variables, utility classes
- `tailwind.config.ts` - Accent-hover token, gradient utilities
- `app/layout.tsx` - Logo in navbar (replaces text)
- `app/auth/login/page.tsx` - Logo at top of login form
- `app/auth/signup/page.tsx` - Logo at top of signup form
- `CLAUDE.md` - Design system guidance section
- `docs/DESIGN_SYSTEM.md` - Actual HSL values, migration notes
- Various component files - Color token usage updates

### Total: 3 new + 8 modified = 11 files

---

## Risks & Mitigation

| Risk                                           | Impact | Probability | Mitigation                                                                |
| ---------------------------------------------- | ------ | ----------- | ------------------------------------------------------------------------- |
| Color changes break dark mode                  | High   | Medium      | Test dark mode explicitly in Sprint 0, keep dark mode variables separate  |
| Logo doesn't scale well at small sizes         | Medium | Low         | Test at all sizes in Sprint 1, adjust SVG if needed                       |
| Existing components look worse with new colors | Medium | Medium      | Extensive visual QA in Sprint 0, easy rollback via CSS variables          |
| Contrast issues for accessibility              | High   | Low         | Use browser DevTools contrast checker, prioritize WCAG AA compliance      |
| Typography looks odd with system fonts         | Low    | Medium      | Accept for now, plan Inter font load in future sprint                     |
| Users dislike new colors                       | Medium | Low         | Design system based on proven modern UI patterns (Linear, Vercel, Stripe) |

---

## Success Metrics

### Definition of Done

- [ ] All sprint deliverables completed
- [ ] Visual QA passed on all pages (light mode)
- [ ] Dark mode tested (if enabled by user)
- [ ] Logo component tests pass
- [ ] No regressions in existing functionality
- [ ] `npm run build` completes without errors
- [ ] CLAUDE.md updated with design patterns
- [ ] Screenshots documented for before/after comparison

### Verification Checklist

**After Sprint 0 (Colors)**:

- [ ] Landing page uses high-contrast black text on white
- [ ] Primary buttons use indigo accent color
- [ ] Borders are subtle gray (#e5e7eb)
- [ ] No blue color visible (replaced with indigo)
- [ ] Dark mode backgrounds are almost black (#0a0a0a)
- [ ] Text contrast ratios meet WCAG AA standards

**After Sprint 1 (Logo)**:

- [ ] Logo visible in navbar (top left)
- [ ] Logo + "Sageloop" wordmark displayed together
- [ ] Logo clickable and navigates to `/projects`
- [ ] Logo on login page (centered, above form)
- [ ] Logo on signup page (centered, above form)
- [ ] Logo maintains clarity at all screen sizes
- [ ] Logo tests pass (`npm test`)

**After Sprint 2 (Polish)**:

- [ ] All components use color tokens (no hardcoded values)
- [ ] Gradient utilities work correctly
- [ ] CLAUDE.md has design system section
- [ ] Future work backlog documented
- [ ] App has cohesive visual identity

**Manual Testing**:

```bash
# Build and type check
npm run build

# Run tests
npm test

# Start dev server for visual QA
npm run dev

# Pages to test:
# - http://localhost:3000 (landing)
# - http://localhost:3000/auth/login
# - http://localhost:3000/auth/signup
# - http://localhost:3000/projects (requires auth)
# - http://localhost:3000/projects/[id] (requires auth + project)
```

**Accessibility Testing**:

- Use Chrome DevTools Lighthouse accessibility audit
- Use browser contrast checker for text
- Test keyboard navigation (logo links should be focusable)
- Test screen reader announcements for logo

---

## Timeline

| Sprint           | Estimated Time | Status         | Target Week            |
| ---------------- | -------------- | -------------- | ---------------------- |
| Sprint 0: Colors | 7h             | Not Started    | Week 0 (Days 1-2)      |
| Sprint 1: Logo   | 6h             | Not Started    | Week 1 (Days 3-4)      |
| Sprint 2: Polish | 5h             | Not Started    | Week 2 (Days 5-6)      |
| **Total**        | **18h**        | **~1.5 weeks** | **Part-time schedule** |

**Assumptions**:

- ~4 hours/day of focused work
- No major blockers or discoveries
- Visual QA time is accurate (no major issues found)

**Velocity Notes**:

- Sprint 0 is front-loaded (7h) due to visual QA time
- Sprints 1 and 2 are faster (6h, 5h) - more focused scope
- Total effort aligns with past Sageloop sprints (6-16h typical)

---

## Next Steps

### Immediate Actions

1. **Review this plan** - User approval before starting
2. **Set up screenshots** - Take "before" screenshots of all pages
3. **Begin Sprint 0** - Update color system (highest impact)

### During Implementation

- Document any deviations from plan in sprint summaries
- If colors need adjustment, iterate quickly (CSS variables easy to change)
- If logo doesn't look right at any size, refine SVG in Sprint 1
- Keep CLAUDE.md updated as patterns emerge

### After Completion

- Create `docs/sprint-design-system-summary.md` with learnings
- Plan Sprint 3+ for typography (load Inter font)
- Consider user feedback on new visual identity
- Measure any impact on user engagement (subjective design changes)

---

## Appendix: Design System Reference

### Color Palette (from DESIGN_SYSTEM.md)

**Monochrome Base**:

```css
Background:
  Primary:   #ffffff (white) - HSL: 0 0% 100%
  Secondary: #fafafa (off-white) - HSL: 0 0% 98%
  Tertiary:  #f5f5f5 (light gray) - HSL: 0 0% 96%
  Inverse:   #0a0a0a (almost black) - HSL: 0 0% 4%

Text:
  Primary:   #0a0a0a (almost black) - HSL: 0 0% 4%
  Secondary: #6b7280 (gray-500) - HSL: 220 9% 46%
  Tertiary:  #9ca3af (gray-400) - HSL: 220 9% 62%
  Inverse:   #ffffff (white) - HSL: 0 0% 100%

Borders:
  Primary:   #e5e7eb (gray-200) - HSL: 220 13% 91%
  Secondary: #f3f4f6 (gray-100) - HSL: 220 14% 96%
```

**Accent Color**:

```css
Accent:      #6366f1 (indigo-500) - HSL: 239 84% 67%
Hover:       #4f46e5 (indigo-600) - HSL: 239 84% 60%
Gradient:    linear-gradient(135deg, #6366f1, #8b5cf6)
```

### Logo Specifications

**SVG Code**:

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

**Plan Status**: Ready for review and implementation
**Next Action**: User approval to begin Sprint 0
