/**
 * Skeleton overlay class.
 *
 * Adapted from Radix UI Themes Skeleton CSS. Applied as a class on top
 * of an existing component, so the visuals (background, border, shadow,
 * color) need to win over the host's own variants. Wrapped in a
 * compound `&&` selector to bump specificity to 0,2,0 — beats any
 * single-class component variant via the cascade alone, no
 * `!important` required.
 *
 * Note: an `!important` background-color (or shorthand `background`)
 * would block the keyframe animation from interpolating the pulse,
 * since CSS animations don't override `!important` declarations.
 *
 * Trade-off: consumer-supplied inline `style` props (which carry
 * 1,0,0,0 specificity) beat this class. Don't ship background or
 * color overrides via inline style on a skeletonized element — pass
 * a class or skip the skeleton.
 *
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/skeleton.css
 */

// `globalStyle` is banned outside @lib/design, but this file pays the
// exception cost intentionally — see the `globalStyle` call below for
// the trade-off rationale.
import { globalStyle, keyframes, style } from '@vanilla-extract/css';
import { neutral, slow, standard } from '@lib/design';

const pulse = keyframes({
  from: { backgroundColor: neutral.alpha[3] },
  to: { backgroundColor: neutral.alpha[4] },
});

// `background: none`, `boxShadow: none`, `color: transparent` are
// deliberate cascade overrides, not design intent. The animation
// supplies the pulsing background-color.
export const skeleton = style({
  selectors: {
    '&&': {
      // `border-radius` is intentionally left untouched so each host
      // component's own corner shape (pill badge, large card, etc.)
      // shows through the placeholder.
      animation: `${pulse} ${slow[2]} ${standard.productive} infinite alternate-reverse`,
      background: 'none',
      border: 'none',
      boxShadow: 'none',
      color: 'transparent',
      cursor: 'default',
      outline: 'none',
      pointerEvents: 'none',
      userSelect: 'none',
      // Skeleton swaps the host's `background` / `color` / `box-shadow`
      // / `border` properties; any `transition` rule the host carries
      // for those would interpolate the change into a flicker as the
      // class is added. Pin transitions off here so the skeleton snaps
      // in instantly. The reverse direction (skeleton → loaded) still
      // reads the host's normal transition, which is desirable — it
      // makes the reveal feel like a deliberate fade-in.
      transition: 'none',
      // Repaints the bg-box across line breaks for inline text wrappers.
      boxDecorationBreak: 'clone',
    },

    // Suppress painted styles on the host's own pseudo-elements (e.g.
    // Card's `::after` border) without using `visibility: hidden` —
    // the trim helper uses `::before`/`::after` with negative margins
    // to remove leading whitespace, and that geometry needs to keep
    // applying while the skeleton is on. Compound class for 0,2,1
    // specificity to beat `.card-variant-surface::after` and friends.
    //
    // `transition: none` matches the host rule above — Switch's track
    // sits on `::before` with its own `background-color` / `filter`
    // transitions, so without this the swap into skeleton interpolates
    // visibly even when the host is transition-pinned.
    '&&::before, &&::after': {
      background: 'none',
      backgroundImage: 'none',
      border: 'none',
      boxShadow: 'none',
      transition: 'none',
    },
  },
});

// The descendant rule below targets nested children, which `selectors:`
// forbids — VE only allows same-element styling there. `globalStyle`
// is the only mechanism that fits, and the rule is required for
// skeleton on container components like Card to actually paint as a
// placeholder. Without it, a `<Heading>` inside a skeletonized Card
// keeps its high-contrast color and shows through the pulse.
//
// The selector is scoped to the skeleton class (a hashed VE name), so
// it can't leak to anything that doesn't opt in via `skeleton={true}`.
globalStyle(`.${skeleton} > *`, {
  visibility: 'hidden',
  // Children stay visible to layout but invisible to paint — their
  // own transitions on `transform`, `box-shadow`, etc. would still
  // fire as the parent skeleton class flips on, producing a flicker.
  // Switch's thumb is the canonical case (transitions on `transform`
  // and `box-shadow` while sliding from on/off → hidden).
  transition: 'none',
});
