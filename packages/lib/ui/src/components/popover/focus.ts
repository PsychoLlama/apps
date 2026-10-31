/** Focus without scrolling: the window floats, so there's nothing to reveal. */
export const NO_SCROLL: FocusOptions = { preventScroll: true };

/** Whether Tab can reach the element, as far as the markup says. */
const isTabbable = (element: HTMLElement) =>
  element.tabIndex >= 0 &&
  !element.matches(':disabled, [inert] *, input[type="hidden"]') &&
  element.checkVisibility({ visibilityProperty: true });

/**
 * Move focus into a freshly opened surface: its first `autofocus`
 * descendant, else its first tabbable one that isn't a link, else the
 * surface itself. Links are skipped as upstream does, since landing on
 * one tells you little about the panel you're in.
 */
export const focusInto = (surface: HTMLElement): void => {
  const descendants = Array.from(surface.querySelectorAll<HTMLElement>('*'));
  const target =
    descendants.find((el) => el.autofocus && isTabbable(el)) ??
    descendants.find((el) => !el.matches('a[href]') && isTabbable(el)) ??
    surface;

  target.focus(NO_SCROLL);
};
