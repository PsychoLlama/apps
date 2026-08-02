import { useCommit, useRun, useValue } from '@lib/state';
import { Button, Dialog, Flex, Text, TextField } from '@lib/ui';
import {
  contactsStore,
  fallbackName,
  renameContactSaga,
} from '../state/contacts';
import { reportSagaFailure } from '../state/failure';
import { deviceFallbackFormula, identityStore } from '../state/identity';
import { LABEL_MAX_LENGTH } from '../state/labels';
import { renameDeviceSaga } from '../state/network';
import {
  renameClosedTopic,
  renameStore,
  type RenameTarget,
} from '../state/view';

/** Ties the field to its label. Only one rename form is ever mounted. */
const NAME_FIELD_ID = 'beam-rename-name';

/** The form control's name, and the key the submit handler reads back. */
const NAME_FIELD = 'label';

/**
 * The rename form for one record, as a modal. Renaming is deliberate and
 * occasional — it isn't part of reading the record — so it opens on request
 * instead of sitting on the page as a field to be edited by accident.
 *
 * Bound to a target rather than to whatever is on screen: the store holds the
 * record the form was opened over, so it can't end up aimed at a different
 * one.
 *
 * It renames this device by the same route it renames a peer, because from the
 * reader's side it is the same act — give this endpoint a name, or clear it and
 * let it fall back. Only the wording and where the name is read from differ,
 * which is what the target decides.
 */
export const RenameDialog = (props: {
  /** The record this form renames. */
  target: RenameTarget;
}) => {
  const rename = useValue(renameStore);
  const book = useValue(contactsStore);
  const self = useValue(identityStore);
  const deviceFallback = useValue(deviceFallbackFormula);
  const runContactRename = useRun(renameContactSaga);
  const runDeviceRename = useRun(renameDeviceSaga);
  const commit = useCommit();

  /** Whether the open form is this one's. */
  const open = () => {
    const active = rename().target;
    const mine = props.target;
    if (!active) return false;
    if (mine.kind === 'self') return active.kind === 'self';
    return active.kind === 'peer' && active.endpointId === mine.endpointId;
  };

  /** The local name as stored, which is where an unresolved one lives. */
  const label = () => {
    const mine = props.target;
    if (mine.kind === 'self') return self().record?.label ?? '';
    return book().entries[mine.endpointId]?.label ?? '';
  };

  /**
   * What the name would revert to if cleared. The placeholder promises what
   * an empty field gets you, so it can't be the resolved name — that's the
   * local name the field is already showing.
   */
  const placeholder = () => {
    const mine = props.target;
    if (mine.kind === 'self') return deviceFallback();

    const stored = book().entries[mine.endpointId];
    return stored ? fallbackName(stored) : '';
  };

  const handleSubmit = (
    event: SubmitEvent & { currentTarget: HTMLFormElement },
  ) => {
    event.preventDefault();

    // `FormData` widens to `File` for the general case; a text input only ever
    // yields a string, so anything else is treated as an empty field.
    const entry = new FormData(event.currentTarget).get(NAME_FIELD);
    const typed = typeof entry === 'string' ? entry : '';
    const mine = props.target;

    // Handed over as typed. The fold normalizes it — trimming, capping, and
    // reading an emptied field as a request to clear the local name — so
    // there's one place that decides what a name may be, rather than one
    // rule here and another wherever the next name comes from.
    if (mine.kind === 'self') {
      void runDeviceRename(typed).catch(
        reportSagaFailure('The device rename saga failed.'),
      );

      return;
    }

    void runContactRename({ endpointId: mine.endpointId, label: typed }).catch(
      reportSagaFailure('The contact rename saga failed.'),
    );
  };

  return (
    <Dialog
      testId="beam-rename-dialog"
      open={open()}
      onOpenChange={() => commit(renameClosedTopic())}
      title={
        props.target.kind === 'self' ? 'Rename this device' : 'Rename contact'
      }
      description={
        props.target.kind === 'self'
          ? 'Choose the name other devices see you by.'
          : 'Choose a nickname for this contact.'
      }
      maxWidth="24rem"
    >
      <Flex as="form" direction="column" gap={4} onSubmit={handleSubmit}>
        <Flex as="div" direction="column" gap={2}>
          <Text
            as="label"
            for={NAME_FIELD_ID}
            size={2}
            weight="medium"
            selectable={false}
          >
            Name
          </Text>
          {/* The cap is the same one a peer's advertised name is held to.
              Enforcing it here as well as in the fold isn't belt-and-braces:
              it's the only place the reader can see the limit, rather than
              discovering it when the name they typed comes back shorter. */}
          <TextField
            testId="beam-contact-name"
            id={NAME_FIELD_ID}
            name={NAME_FIELD}
            value={label()}
            placeholder={placeholder()}
            maxlength={LABEL_MAX_LENGTH}
            autofocus
            autocomplete="off"
            autocapitalize="words"
            enterkeyhint="done"
          />
        </Flex>

        <Flex as="div" direction="row" gap={2} justify="end">
          <Button
            testId="beam-rename-cancel"
            type="button"
            variant="soft"
            color="neutral"
            onClick={() => commit(renameClosedTopic())}
          >
            Cancel
          </Button>
          <Button testId="beam-rename-save" type="submit">
            Save
          </Button>
        </Flex>
      </Flex>
    </Dialog>
  );
};
