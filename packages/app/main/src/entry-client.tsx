// @refresh reload
import './theme';
import '@lib/design';
import { mount, StartClient } from '@solidjs/start/client';

mount(() => <StartClient />, document.getElementById('app')!);
