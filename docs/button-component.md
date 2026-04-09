# Button Component Plan

## Context

The `#ui` library has layout (Box, Flex, Grid) and typography (Text, Heading) components but no interactive components. Button is the first, living under `src/ui/components/`. Inspired by Radix UI Themes but adapted to our Vanilla Extract + restricted token palette.

## Props API

```typescript
type ButtonSize = 1 | 2 | 3 | 4;
type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost';
type ButtonColor = 'accent' | 'neutral' | 'danger';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize; // Default: 2
  variant?: ButtonVariant; // Default: 'solid'
  color?: ButtonColor; // Default: 'accent'
  disabled?: boolean;
}
```

**Key decisions:**

- **No `as` prop** — Button hardcodes `<button>`. Links-as-buttons can share CSS later without sharing the component, avoiding `HTMLElement` type compromise and SPA routing questions.
- **`color` with token-aligned values** — `accent` / `neutral` / `danger` match the design token names 1:1. Same naming pattern as Radix.
- **No `loading`** — keeps scope tight, easy to add later.
- **No explicit icon props** — children-based composition: `<Button><Icon /> Label</Button>`.

## Size Mappings

Matches Radix UI's approach: explicit `height` + horizontal padding (no vertical padding).

| Size | Type Scale | Height         | Padding-x      | Gap     | Radius  | Min-width      |
| ---- | ---------- | -------------- | -------------- | ------- | ------- | -------------- |
| 1    | 1          | space.5 (24px) | space.2 (8px)  | space.1 | 1 (3px) | space.5 (24px) |
| 2    | 2          | space.6 (32px) | space.3 (12px) | space.1 | 2 (4px) | space.6 (32px) |
| 3    | 3          | space.7 (40px) | space.4 (16px) | space.2 | 3 (6px) | space.7 (40px) |
| 4    | 4          | space.8 (48px) | space.5 (24px) | space.2 | 4 (8px) | space.8 (48px) |

Min-width matches height so icon-only buttons are square by default. Size-4 bumps to radius 4 following Radix proportions (update radius docs to note large controls as an exception).

## Variant x Color Mappings

Using the 12-step color scale (3-5 = component fills, 6-8 = borders, 9-10 = solid fills, 11-12 = text):

| Variant | Background   | Hover         | Active        | Text                                                     | Border                            |
| ------- | ------------ | ------------- | ------------- | -------------------------------------------------------- | --------------------------------- |
| solid   | `{color}[9]` | `{color}[10]` | `{color}[10]` | `white[12]` (accent/danger), `background.page` (neutral) | --                                |
| soft    | `{color}[3]` | `{color}[4]`  | `{color}[5]`  | `{color}[11]`                                            | --                                |
| outline | transparent  | `{color}[3]`  | `{color}[4]`  | `{color}[11]`                                            | `{color}[7]` via inset box-shadow |
| ghost   | transparent  | `{color}[3]`  | `{color}[4]`  | `{color}[11]`                                            | --                                |

## Interactive States

- **`:hover`** -- guarded by `@media (hover: hover)` to avoid sticky hover on touch
- **`:active`** -- next color step up from hover
- **`:focus-visible`** -- `outline: 2px solid accent[8]`, `outline-offset: 2px`. Always accent regardless of color prop.
- **`:disabled`** -- `opacity: 0.5`, `pointer-events: none`, `cursor: not-allowed`

## Files to Create

```
src/ui/components/button/
  button.tsx          -- Component
  button.css.ts       -- Styles (base, size variants, variant x color matrix)
  button.stories.tsx  -- Storybook story
```

## Files to Modify

- `src/ui/index.ts` -- add `Button` and `ButtonProps` exports

## CSS Structure (`button.css.ts`)

```
base            -- reset (border:none, bg:none, cursor:pointer), inline-flex,
                   align-items:center, justify-content:center, font-family,
                   font-weight:medium, transition, user-select:none
size[1-4]       -- styleVariants: fontSize, lineHeight, letterSpacing, height,
                   min-width, paddingInline, gap, borderRadius
variantColor    -- nested object: variantColor.solid.accent = style({ ... })
                   Each style() includes base colors + :hover, :active,
                   :focus-visible, :disabled pseudo-classes
                   4 variants x 3 colors = 12 total style() calls
```

## Component Structure (`button.tsx`)

1. `mergeProps` for defaults (`size: 2`, `variant: 'solid'`, `color: 'accent'`)
2. `splitProps` to separate button-specific props from native button attributes
3. Class assembly: `[base, size[s], variantColor[v][c], class].filter(Boolean).join(' ')`
4. Render `<button>` directly (no `Dynamic`)

## Story (`button.stories.tsx`)

- `title: 'UI/Components'`
- Controls for: `size`, `variant`, `color`, `disabled`, `children`
- Single default story: `export const Button: Story = {}`

## Verification

1. `pnpm storybook` -- visually inspect all variant/color/size combos
2. `just check` -- formatting and type checks pass
3. Verify hover/active/focus/disabled states in browser
4. Verify light/dark mode color correctness
