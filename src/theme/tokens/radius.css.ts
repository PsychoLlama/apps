/**
 * Border radius tokens derived from Radix UI Themes' radius scale.
 * Source: https://github.com/radix-ui/themes (MIT)
 * Docs: https://www.radix-ui.com/themes/docs/theme/radius
 *
 * 6-step scale matching Radix's "medium" preset at 100% scaling. Plain
 * constants rather than a contract because radius values are layout
 * invariants — they don't change with theme or color scheme.
 *
 * The scale maps to a control/container hierarchy. Steps 1–2 are for
 * interactive controls, step 3 straddles both, and steps 4–6 are for
 * content containers. Controls match their size variant to the radius
 * step (size-2 button → radius-2). Containers jump ahead because they
 * are visually larger and need more rounding to look proportional
 * (size-1 card → radius-4).
 *
 * Some components bypass the scale entirely, computing radius from `em`
 * or element dimensions so rounding scales with the element itself
 * (inline code, kbd, slider tracks, progress bars). Handle those in
 * component files.
 */
export const radius = {
  /**
   * Smallest rounding. For compact controls (small buttons, checkboxes,
   * menu items) and tiny decorative elements (spinner leaves, skeleton blocks).
   */
  1: '3px',

  /**
   * Default interactive rounding. For buttons, inputs, selects, tooltips,
   * and other standard-sized controls. The most commonly used step.
   */
  2: '4px',

  /**
   * Small container rounding. For compact containers (small callouts,
   * small dropdown panels, card-like selection items) and large interactive
   * controls (size-3 buttons, inputs). The crossover between "control" and
   * "container".
   */
  3: '6px',

  /**
   * Standard container rounding. For cards, dialogs, popovers, dropdown
   * panels, and other floating surfaces at their default size.
   */
  4: '8px',

  /**
   * Large container rounding. For oversized cards, dialogs, and popovers.
   * Never used on interactive controls — only on content containers.
   */
  5: '12px',

  /**
   * Maximum rounding. For the largest cards and display-size avatars.
   * Rarely used — most containers cap at radius-5.
   */
  6: '16px',

  /** 9999px pill shape for tags, badges, avatars, and similar. */
  full: '9999px',
} as const;
