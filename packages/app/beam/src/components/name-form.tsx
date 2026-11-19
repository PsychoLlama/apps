import { Button, Flex, TextField } from '@lib/ui';

/**
 * One name, and a way to change it: a field holding what it is now, and a
 * button to save what it's been made.
 *
 * A real `<form>`, so Enter saves. Uncontrolled: the field is seeded with
 * the current name and holds the edit itself.
 */
export const NameForm = (props: {
  /** Names the field and its button for tests: `<testId>-name`, `-save`. */
  testId: string;

  /** What the field is for, read out and never shown. */
  label: string;

  /** The name as it stands. */
  value: string;

  /** What an empty field shows. Giving one lets the name be cleared. */
  placeholder?: string;

  /** Longest name allowed. */
  maxLength: number;

  /** Whether a save is under way. */
  pending: boolean;

  /** Called with what was typed when the form is submitted. */
  onSave: (name: string) => void;
}) => {
  const handleSubmit = (
    event: SubmitEvent & { currentTarget: HTMLFormElement },
  ) => {
    event.preventDefault();

    const name = new FormData(event.currentTarget).get('name');
    if (typeof name === 'string') props.onSave(name);
  };

  return (
    <Flex as="form" gap={2} onSubmit={handleSubmit}>
      <Flex as="div" direction="column" grow>
        <TextField
          testId={`${props.testId}-name`}
          name="name"
          aria-label={props.label}
          value={props.value}
          placeholder={props.placeholder}
          required={props.placeholder === undefined}
          maxlength={props.maxLength}
          autocomplete="off"
          autocapitalize="words"
          enterkeyhint="done"
        />
      </Flex>

      <Button
        testId={`${props.testId}-save`}
        type="submit"
        variant="soft"
        disabled={props.pending}
      >
        Save
      </Button>
    </Flex>
  );
};
