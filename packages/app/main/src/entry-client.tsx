// @refresh reload
import './theme';
import '@lib/design';
import { configure } from '@lib/observability';
import { mount, StartClient } from '@solidjs/start/client';

configure();

mount(() => <StartClient />, document.getElementById('app')!);
