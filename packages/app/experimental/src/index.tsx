import { onMount } from 'solid-js';
import { Flex } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import { createLogger } from '@lib/observability';
import init from '@lib/hello-wasm';

const logger = createLogger(import.meta.INSTRUMENTATION_SCOPE);

// First wasm consumer — proves the Cargo → vite pipeline reaches the
// browser. The crate exposes the message via two `extern "C"` accessors
// so the JS side reads it straight out of linear memory, skipping the
// wasm-bindgen glue.
const loadMessage = async (): Promise<string> => {
  const { exports } = await init();
  const bytes = new Uint8Array(
    exports.memory.buffer,
    exports.message_ptr(),
    exports.message_len(),
  );
  return new TextDecoder().decode(bytes);
};

export const Experimental = () => {
  onMount(() => {
    loadMessage().then(
      (message) => logger.info(message),
      (error: unknown) => {
        logger.error('hello-wasm init failed', {
          error: error instanceof Error ? error : new Error(String(error)),
        });
      },
    );
  });

  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Experimental" />
    </Flex>
  );
};
