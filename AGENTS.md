# Agent Instructions & Design System Guidelines

This file contains rules and instructions for future AI-assisted development and developers working on this project. 

## Project Architecture & Conventions
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS v4 with a custom Design System
- **Components**: Grouped by features (`src/features`) with shared components in `src/components/shared` and `src/components/ui`.

## Design System

The design system is located at: `apps/web/src/design-system/`

It is the single source of truth for all styling variables. When building or modifying UI, you must prioritize using the predefined tokens over hardcoding values.

### Rules for using the Design System

1. **Colors (`tokens.css`, `themes/*.css`)**
   - **DO NOT** use arbitrary hex values or standard Tailwind colors (e.g., `bg-[#e11d48]`, `text-blue-500`) for primary UI elements.
   - **DO** use the semantic color tokens provided in the design system:
     - `primary` (and `primary-hover`, `primary-subtle`, `primary-foreground`)
     - `success`, `danger`, `warning`, `info` (and their respective `-hover` variants)
     - `background`, `background-subtle`, `foreground`
   - Example: `<button className="bg-primary hover:bg-primary-hover text-primary-foreground">`

2. **Typography (`components.css`)**
   - **DO NOT** use arbitrary font sizes or weights (e.g., `text-[13px]`, `text-[22px] font-extrabold`).
   - **DO** use the typography component classes:
     - Display: `display-large`, `display-medium`, `display-small`
     - Title: `title-large`, `title-medium`, `title-small`
     - Body: `body-large`, `body-medium`, `body-small`, `body-xsmall`

3. **Spacing & Radius (`foundations/spacing.css`, `foundations/radius.css`)**
   - Spacing ranges from `none` to `5xl`. Use these with Tailwind's margin/padding utilities (e.g., `p-md`, `mt-xl`).
   - Radius ranges from `none` to `full`. Use these with Tailwind's rounding utilities (e.g., `rounded-md`, `rounded-full`).

4. **Component Patterns (`components.css`)**
   - Check `components.css` for existing utility patterns before creating new ones (e.g., `.divider-primary-half`).
   - If an existing UI pattern is unsupported by the design system, extend the design system by adding tokens to `light.css` / `dark.css` and mapping them in `tokens.css`, rather than hardcoding the values.

### Adding New Instructions
*(You can append new architectural or domain-specific instructions below this section)*
