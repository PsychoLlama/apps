import { Flex } from '@lib/ui';
import { SiteHeader } from '@lib/shell';

export const Gallery = () => {
  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Gallery" />
    </Flex>
  );
};
