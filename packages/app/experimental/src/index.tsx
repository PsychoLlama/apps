import { Show, onMount } from 'solid-js';
import {
  createStore,
  defineAction,
  defineEffect,
  defineStore,
  useEffect,
} from '@lib/state';
import { Code, Container, Flex, Section, Text } from '@lib/ui';
import { SiteHeader } from '@lib/shell';
import init from '@lib/hello-wasm/hello.wasm?init';

interface HelloExports {
  memory: WebAssembly.Memory;
  message_ptr(): number;
  message_len(): number;
}

interface WasmState {
  /** Decoded message from the hello-wasm module. `undefined` until the load resolves. */
  message: string | undefined;
}

// First wasm consumer — proves the Cargo → vite pipeline reaches the
// browser. The crate exposes the message via two `extern "C"` accessors
// so the JS side reads it straight out of linear memory, skipping the
// wasm-bindgen glue.
const loadMessage = async (): Promise<string> => {
  const instance = await init();
  const exports = instance.exports as unknown as HelloExports;
  const bytes = new Uint8Array(
    exports.memory.buffer,
    exports.message_ptr(),
    exports.message_len(),
  );
  return new TextDecoder().decode(bytes);
};

const wasmStore = defineStore<WasmState>(() => ({ message: undefined }));
const wasm = createStore(wasmStore);

const setMessage = defineAction([wasmStore], (state, message: string) => {
  state.message = message;
});

const loadMessageEffect = defineEffect([], loadMessage, {
  onSuccess: setMessage,
});

export const Experimental = () => {
  const load = useEffect(loadMessageEffect);
  onMount(() => void load());

  return (
    <Flex as="main" direction="column" grow>
      <SiteHeader title="Experimental" />
      <Section>
        <Container as="div">
          <Text as="p" selectable={false}>
            wasm says{' '}
            <Show when={wasm.message} fallback={<Code>loading…</Code>}>
              <Code>{wasm.message}</Code>
            </Show>
          </Text>
        </Container>
      </Section>
    </Flex>
  );
};
