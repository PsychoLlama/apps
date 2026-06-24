import type { Listing } from '#gallery';
import Kbd, { type KbdProps } from './kbd';

/**
 * Gallery listing for `Kbd`. Enumerates the component across its visual
 * axes.
 */
export default {
  title: 'Kbd',
  group: 'typography',
  render: (props) => <Kbd {...props}>Esc</Kbd>,
  sections: [
    {
      title: 'Variant',
      columns: [
        { title: 'Classic', props: { variant: 'classic' } },
        { title: 'Soft', props: { variant: 'soft' } },
      ],
    },
  ],
} satisfies Listing<KbdProps>;
