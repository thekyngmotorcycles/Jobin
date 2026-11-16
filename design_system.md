# Jobeen — Design System

> Version 1.0 · 2026-11-16 · Status: approved design governance
>
> Scope: Design standards and approval workflow for Jobeen mobile and web. This document does not authorize changes to existing screens.

## 1. Core approach

Jobeen uses **Material Design 3 (Material You)** as its foundational system for layout, typography, interaction, accessibility, component behavior and responsive design, while retaining its **own silver-and-gold premium identity**.

Use established interaction patterns from apps such as LinkedIn (professional profiles and trust), Instagram (profiles and media), TikTok (full-screen video and discovery), and Google apps (clear controls and system feedback). These are **usability references, not instructions to copy visual designs, branding or proprietary assets**. When patterns conflict, prioritize user-approved Jobeen behavior and accessibility.

## 2. Non-negotiable change approval protocol

**Before making ANY visual or UX change, always:**

1. Explain the requested change and its scope in text.
2. Propose **2 or 3 concrete text-only alternatives**, including trade-offs and a recommendation.
3. Wait for **explicit user approval of a specific alternative**.
4. Apply **only the approved change**, to the approved screens/files/branch.
5. Report the actual files changed, checks performed, and any unresolved issues.

No implied approval. No speculative redesigns, refactors, theme changes, migrations, deployments, APK builds, or adjacent fixes. Do not generate mockups, screenshots or images unless the user requests them. A request to discuss or diagnose is not authorization to edit. If the user writes **“Fix”**, treat it as a report of failed tests and investigate the failure; obtain approval for the proposed repair before changing code unless the user explicitly authorizes that repair.

When a requirement is ambiguous, ask rather than guessing. Preserve all previously approved placements, copy, dimensions, behaviors and visual decisions unless explicitly changed.

## 3. Brand foundations

- **Brand:** Jobeen (formerly Jobin). Keep the existing approved logo and JCard SVG assets; do not substitute recreated assets.
- **Visual character:** professional, restrained, premium, readable.
- **Palette:** silver and gold accents with existing Jobeen dark/light surfaces. Preserve established color tokens and existing approved values; do not introduce or replace hex colors without approval.
- **JCard:** retain approved composition, discreet SVG watermark, subtle QR border/shadow, verified marker, experience/availability chips, and language layout.
- **Surfaces:** gradient/translucent navigation bars and subtle elevation where previously approved; avoid decorative effects that compromise contrast or performance.
- **Theme:** support light/dark and system accessibility settings where applicable; respect user-selected JCard appearance, including “Por defecto”.

Before implementation, inspect existing design tokens and components. This document is a specification, **not a mandate to rewrite them**.

## 4. Material Design 3 foundations

### Color
Use semantic roles instead of scattered hardcoded colors: primary, on-primary, secondary, on-secondary, surface, on-surface, surface-container, outline, error, and corresponding variants. Map these roles to Jobeen-approved brand tokens. Maintain adequate contrast: target WCAG AA (4.5:1 for normal text, 3:1 for large text and meaningful UI boundaries). Do not assume metallic gold on light silver is legible.

### Typography
Adopt a consistent M3-inspired scale (display, headline, title, body, label), with approved fonts and weights. Use readable line heights and dynamic font scaling. Never crop glyphs or hide critical labels when text grows; support truncation only where explicitly approved and provide access to full meaning.

### Spacing and layout
Use a consistent **4 dp spacing grid**, with common increments of 4, 8, 12, 16, 24 and 32 dp. Respect safe areas, status/navigation bars, keyboard insets, device cutouts, scroll bounds, and touch targets. Prefer adaptive layouts to device-specific pixel offsets. Ensure layouts remain usable on compact Android devices.

### Shape, elevation and motion
Reuse approved corner radii, shadows and elevation tokens. Apply M3 motion principles: transitions should communicate hierarchy and state, not add latency. Honor reduced-motion preferences where supported. Avoid heavy blur and layered effects on performance-sensitive views.

### Components and states
Prefer reusable buttons, chips, text fields, sheets, dialogs, tabs, navigation elements and cards. Define and verify default, pressed, focused, selected, disabled, loading, error and empty states. Maintain touch targets of approximately **48 × 48 dp** where possible, with adequate separation and visible focus/feedback.

## 5. Navigation and interaction references

- **Top navigation:** preserve approved Jobeen positions and gradient treatment; do not invade the system status bar.
- **Bottom navigation:** preserve Videos / JShop / Mensajes / Perfil and approved translucent gradient.
- **Discovery/search:** use predictable filter selection and scrolling. The **Todo** filter is selected by default when approved; it searches across all registered account types.
- **Videos:** preserve full-screen media behavior and approved actions. Use TikTok/Instagram only as interaction references, not visual templates.
- **Professional identity:** prioritize clarity and credibility in personal/business JCards, drawing on familiar professional profile patterns.
- **Forms and account setup:** use clear labels, inline validation, visible keyboard-safe actions, and predictable back/continue behavior.

## 6. Screen quality requirements

Every screen must meet the following acceptance criteria:

- No button, label, icon, tab or control is clipped in any interactive state.
- Horizontal chip/filter rows scroll correctly; selecting **Flashes** or **Streams** must not introduce an overlay, clipping boundary, typography cut-off or unexpected shift.
- Selected and unselected states use consistent text metrics and sufficient space.
- All interactive targets remain usable at compact widths and increased font sizes.
- Keyboard, system bars, loading states and asynchronous data do not obscure required actions.
- Interaction feedback is immediate; expensive operations use appropriate loading or skeleton states.
- No unauthorized movement, resizing, renaming or visual change to approved elements.

## 7. JCard-specific invariants

### Personal JCard
Keep the discreet approved SVG watermark, small upper-right QR with subtle shadow, profile image left, legal name and username to its right, compact verification mark adjacent to the name, profession placement, language-above-percentage circles, and centered experience/availability chips. Preserve the approved secondary-profession and tooltip behavior.

### Business JCard
Keep the upper-right QR, profile image and business name/category hierarchy, approved transparent relief-style reviews bubble, contact details, and lower seal row. Preserve seal iconography and explanatory modals. Respect the approved visibility/disabled-card behavior for visitors versus owners.

## 8. Implementation workflow for every future screen

1. **Inspect:** read the current screen, existing tokens, components, constraints and previously approved decisions.
2. **Propose:** provide 2–3 text alternatives, each with UX rationale, scope and risks; recommend one.
3. **Wait:** obtain explicit approval.
4. **Implement narrowly:** reuse tokens/components; change only approved files and behaviors.
5. **Validate:** run relevant lint/type/tests/build checks available for the project, plus manual state/responsive checks where possible.
6. **Report:** specify exact changes, verification results and remaining issues. Never claim checks passed if not run.

## 9. Governance and precedence

For conflicts, follow this order:
1. The user's latest explicit approval and scope.
2. Previously approved Jobeen decisions and behaviors.
3. This design system.
4. Material Design 3 guidance.
5. Familiar third-party app interaction conventions.

This document is a living reference. **Changes to the design system itself also require 2–3 text options and explicit approval**.

## 10. Official reference

Material Design 3: https://m3.material.io/

Use the official specification as a guide, adapting it to Jobeen rather than applying visual defaults blindly.
