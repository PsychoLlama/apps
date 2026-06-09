import { Flex } from '@lib/ui';
import { SiteHeader } from '@lib/shell';

export const Experimental = () => {
  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Experimental" />
    </Flex>
  );
};
