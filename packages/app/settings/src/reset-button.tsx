import { Button } from '@lib/ui';

/** Props for {@link ResetButton}. */
export interface ResetButtonProps {
  /** Test identifier forwarded to the underlying button. */
  testId: string;
  /**
   * Accessible name for the control. The visible text is always "Reset",
   * so this distinguishes one reset from its siblings on the page (e.g.
   * "Reset log filter" vs. "Reset theme").
   */
  label: string;
  /**
   * Whether the setting already matches its default. A reset is a no-op in
   * that state, so the button disables itself rather than disappearing —
   * the affordance stays put as a hint that a default exists.
   */
  disabled: boolean;
  /** Invoked when the user activates the button. */
  onReset: () => void;
}

/**
 * The settings page's shared "Reset" affordance — a muted ghost button
 * sized to sit inline beside a section heading. Reverts a single setting
 * to its default; pair `disabled` with whether the setting is already
 * default so every reset across the page looks and behaves identically.
 */
export const ResetButton = (props: ResetButtonProps) => (
  <Button
    testId={props.testId}
    aria-label={props.label}
    variant="ghost"
    color="neutral"
    size={1}
    disabled={props.disabled}
    onClick={() => props.onReset()}
  >
    Reset
  </Button>
);
