import { TextField } from '@lib/ui';

/**
 * One name, edited in place. It's saved when the field is left or Enter
 * is pressed, the way a settings field is expected to, so there's no
 * button to find.
 */
export const NameField = (props: {
  /** Names the field for tests. */
  testId: string;

  /** What the field is for, read out and never shown. */
  label: string;

  /** The name as it stands. */
  value: string;

  /** What an empty field shows. */
  placeholder?: string;

  /** Longest name allowed. */
  maxLength: number;

  /** Called with what was typed, when it's different from what was there. */
  onSave: (name: string) => void;
}) => (
  <TextField
    testId={props.testId}
    name={props.testId}
    aria-label={props.label}
    value={props.value}
    placeholder={props.placeholder}
    maxlength={props.maxLength}
    autocomplete="off"
    autocapitalize="words"
    enterkeyhint="done"
    // Fires on blur and on Enter, and only when the text changed.
    onChange={(event) => {
      const name = event.currentTarget.value.trim();
      if (name !== props.value) props.onSave(name);
    }}
  />
);
