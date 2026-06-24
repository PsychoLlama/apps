import type { Listing } from '#gallery';
import Em from './em';
import Text from '../text/text';

/**
 * Gallery listing for `Em`. A text-level emphasis mark with no visual axes —
 * shown once in context.
 */
export default {
  title: 'Em',
  group: 'typography',
  render: () => (
    <Text as="p" selectable>
      Quick <Em>brown</Em> fox.
    </Text>
  ),
} satisfies Listing;
