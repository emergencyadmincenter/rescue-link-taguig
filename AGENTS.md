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

_(You can append new architectural or domain-specific instructions below this section)_

## Global UI & Interaction Principles

To maintain a polished, professional, and production-ready interface, strictly adhere to the following interaction rules:

1. **Consistent Interactive Feedback**
   - Every interactive element (buttons, links, cards, list items, checkboxes, dropdowns, etc.) **must** provide visual feedback on hover, focus, and active states.
   - Use context-aware styling. Avoid identically styling all elements (e.g., destructive actions should have destructive hovers; primary actions should have primary hovers).
   - Ensure the correct semantic cursor is applied (e.g., `cursor-pointer`).

2. **Smooth Transitions**
   - Hover, focus, and state changes should never be abrupt.
   - Always use appropriate transition classes (e.g., `transition-all duration-200 ease-in-out`).

3. **Prevent Layout Shifting (Selective Application)**
   - Preventing layout shift is important, but reserved space should be used thoughtfully.
   - **DO** reserve space for predictable inline content (such as form validation messages, small inline field errors, and helper text beneath inputs) using `min-h-[Xpx]` or similar techniques so forms do not jump when messages appear.
   - **DO NOT** permanently reserve space for transient UI elements like global alerts, toasts, temporary banners, or optional components where an empty placeholder would create unnecessary blank whitespace. Instead, let them render conditionally (preferably with smooth enter/exit animations).

4. **Skeleton Loaders**
   - Skeleton loaders should serve as a realistic visual preview of the final interface.
   - They must closely mirror the dimensions, structure, and layout of the final rendered components (e.g., if rendering a grid of cards, the skeleton should also be a grid of identically sized cards).
   - This prevents noticeable layout shifts when the real data finishes loading.

5. **Color Contrast & Readability**
   - Ensure all text passes minimum accessibility contrast ratios.
   - Be extremely careful with "checked" or "active" states (e.g., text on light background accents should remain dark/primary, not foreground/white).

6. **Entity Formatting**
   - Display system entities (such as role names: `admin`, `coordinator`) in Title Case in the UI.
   - Prefer using CSS utilities like `capitalize` directly in the markup to avoid mutating the underlying data layer.

7. **Confirmation Dialogs**
   - **Never** use browser native dialogs (`window.confirm`, `window.alert`, `window.prompt`).
   - All confirmation interactions must use the shared reusable `<ConfirmationDialog />` component.

8. **Contextual Primary Actions**
   - Place primary actions (e.g., "New System Permission") within the contextual sticky header or toolbar of the feature they belong to, rather than floating them globally above the content.
   - This ensures actions remain visible while scrolling and are contextually grouped.

9. **Resource Discoverability & Ordering**
   - Newly created resources should be surfaced prominently when it improves discoverability (e.g., new permission groups appearing first in the list).

10. **Role-Based Access Control (RBAC) Principles**
    - Generate permissions only for actual application modules and features. Avoid creating unnecessary or artificial permission resources (e.g., do not create "permissions" or "roles" as permission resources unless exposing a granular sub-delegation feature).
    - Rely on centralized RBAC guards/middleware (e.g., `@Roles('admin')` on the backend) rather than implementing page-specific authorization logic.
    - Permission names are generated from `resource:action`. The generated name is displayed but not directly editable.

11. **User Feedback (Toast Notifications)**
    - All asynchronous operations must provide user feedback.
    - Use the shared toast notification system (`react-hot-toast` via `ToastProvider`).
    - Toasts should appear in the bottom-right corner.
    - Avoid browser alerts for operation results entirely.

12. **Hover & Interaction consistency**
    - Every interactive component (buttons, links, menus, rows) must provide consistent hover, focus, and active feedback.
    - Apply these interaction patterns across the entire application using global or utility CSS.
    - Hover styling should be context-aware rather than identical across fundamentally different elements.

13. **Landing Page & Public Facing Architecture**
    - Landing pages should be strictly componentized into reusable sections (e.g., `HeroSection`, `FAQSection`, `CTASection`, `EmergencyHotlinesSection`). Avoid building large monolithic page components. Informational landing page sections should be implemented as reusable components.
    - Card-based informational content should be responsive and accessible by default.
    - Use consistent illustration styles throughout a single page. Illustrations or Lottie animations should complement the content rather than overpower it.
    - New landing page sections should maintain consistent spacing, typography, and interaction patterns with the rest of the site.
    - All interactive elements must adhere to the project's hover, focus, transition, and accessibility standards.
    - Responsive behavior is strictly required for every new page and component (mobile, tablet, and desktop).
    - Optimize assets (using `next/image`) and layouts to minimize layout shifts and maximize perceived performance.

14. **Workspace & Data-Heavy Interfaces**
    - Workspace pages should use fixed viewport layouts with independently scrollable content areas where appropriate.
    - Forms in dialogs should have constrained heights with internal scrolling when necessary.
    - Detail panels should use auto-save for low-risk edits where appropriate.
    - List-detail interfaces should maintain layout stability during state changes.
    - Feature-specific UI states should be implemented as reusable components rather than page-specific logic.
    - Components should be designed with future real-time integration in mind.
