// @refresh reload
import '@lib/observability/register/page';
import { mount, StartClient } from '@solidjs/start/client';

mount(() => <StartClient />, document.getElementById('app')!);
