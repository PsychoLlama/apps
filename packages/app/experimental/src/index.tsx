import { Frame, FrameBody, SiteHeader } from '@lib/shell';
import { Flex, Text } from '@lib/ui';
import { FloatingContainer, anchor } from '@lib/ui/_internal/floating-ui';
import * as css from './index.css';

export const Experimental = () => {
  return (
    <Frame>
      <SiteHeader title="Experimental" />
      <FrameBody>
        <Flex as="section" class={`${css.anchorBox} ${anchor}`}>
          <FloatingContainer>
            <Text as="p" selectable={false}>
              Floating Window
            </Text>
          </FloatingContainer>
        </Flex>
      </FrameBody>
    </Frame>
  );
};
