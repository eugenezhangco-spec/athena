---
description: "Design skill triggers: when to use taste-design, redesign-audit, soft-premium, output-enforcement, minimalist-editorial"
paths:
  - "**/*.{ts,tsx,js,jsx,py,go,rs,java,css,scss,html}"
  - "src/**/*"
  - "bot/**/*"
  - "agents/**/*"
  - "scripts/**/*"
---
# Design Skills — When to Trigger

## Available Design Skills (from Taste Skill repo)

| Skill | When to Trigger | What it Does |
|-------|----------------|-------------|
| **taste-design** | ANY frontend work: new components, pages, layouts | Core design rules. Anti-generic AI patterns. Premium typography (Geist, Satoshi). One accent color. Spring animations only. Mobile-first. |
| **redesign-audit** | When upgrading or refactoring existing UI | Design audit checklist. Identifies generic AI patterns. Prioritised fix order. Works with Tailwind. |
| **soft-premium** | Hero sections, landing pages, high-impact visual areas | Awwwards-tier premium. Motion choreography. Magnetic buttons. Scroll interpolation. Double-bezel cards. |
| **output-enforcement** | ALL code generation tasks (not just frontend) | Bans `// TODO`, `// ...`, placeholder comments. Forces complete code output. Clean pause/resume on token limits. |
| **minimalist-editorial** | Data-dense pages (search results, comparison tables, credential details) | Clean editorial style. Warm monochrome. Serif/sans-serif contrast. Flat bento grids. Muted pastels. No gradients. |

## Combined Usage by Page Type

### Landing Page / Hero Section
→ taste-design + soft-premium + output-enforcement
High-impact visual with premium typography, motion choreography, and a strong focal point.

### Data-Dense Pages (search results, tables, dashboards)
→ taste-design + minimalist-editorial + output-enforcement
Clean editorial style. Warm monochrome, clear typography hierarchy, no heavy shadows.

### Detail / Record Pages
→ taste-design + minimalist-editorial + output-enforcement
Data-focused but premium. Bento grid layout. Serif headings, sans-serif data fields.

### Comparison / Side-by-Side Views
→ taste-design + minimalist-editorial + output-enforcement
Clean table layout, muted accents for key values, flat structure.

### Any Component Work
→ taste-design + output-enforcement (minimum)
Every component must follow taste-design rules. No exceptions.

## Anti-Patterns (BANNED)

These are explicitly banned by the taste-design skill. Do NOT use:
- Inter font (the default AI font)
- Purple/blue gradients (the default AI color scheme)
- 3-column centered card layouts (the default AI layout)
- Centered hero with gradient background
- Generic placeholder names ("Acme Corp", "John Doe")
- Oversaturated colors (saturation > 80%)
- Emojis in UI
- AI copywriting cliches ("Unlock", "Supercharge", "Revolutionize")
- `h-screen` (use `min-h-[100dvh]` instead)
- CSS blur/grain on scrolling containers
- Linear easing on animations (use spring physics)

## Integration with Existing Skills

These design skills COMPLEMENT (not replace) existing skills:
- `frontend-patterns` — React/Next.js architecture patterns (still applies)
- `ui-styling` — shadcn/ui component library (still applies)
- `ui-ux-pro-max` — broad UI/UX intelligence (still applies)
- `coding-standards` — TypeScript/React standards (still applies)

The Taste skills add VISUAL QUALITY on top of the architectural foundation.
