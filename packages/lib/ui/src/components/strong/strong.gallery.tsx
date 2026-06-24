import type { Listing } from '#gallery';
import Strong from './strong';
import Text from '../text/text';

/**
 * Gallery listing for `Strong`. A text-level importance mark with no visual
 * axes — shown once in context.
 */
export default {
  title: 'Strong',
  group: 'typography',
  render: () => (
    <Text as="p" selectable>
      Quick <Strong>brown</Strong> fox.
    </Text>
  ),
} satisfies Listing;
