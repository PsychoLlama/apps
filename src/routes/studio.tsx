import { createSignal, For, Show } from 'solid-js';
import { Box, Button, Callout, Flex, Heading, Text } from '#ui';
import IconAlertCircleOutline from 'virtual:icons/mdi/alert-circle-outline';
import SiteHeader from '../components/site-header';
import * as css from './studio.css';

type State = 'idle' | 'recording' | 'paused' | 'error' | 'unsupported';

// --- Fake data ---

interface Recording {
  name: string;
  duration: string;
}

const library: Recording[] = [
  { name: 'Team Standup 2026-04-07', duration: '12:34' },
  { name: 'Bug Repro — Login Redirect Loop', duration: '3:21' },
  { name: 'Feature Demo for PM Review', duration: '8:45' },
  { name: 'Onboarding Walkthrough v2', duration: '22:10' },
];

interface Track {
  id: string;
  type: 'screen' | 'tab' | 'microphone' | 'system-audio';
  label: string;
  live: boolean;
}

const sessionTracks: Track[] = [
  { id: '1', type: 'screen', label: 'Entire Screen', live: true },
  { id: '2', type: 'system-audio', label: 'System Audio', live: true },
  { id: '3', type: 'tab', label: 'Chrome Tab — Figma', live: true },
  { id: '4', type: 'microphone', label: 'Blue Yeti', live: false },
];

// --- Library panel ---

function LibraryPanel() {
  return (
    <Box as="aside" class={css.panel}>
      <Flex
        as="div"
        align="center"
        justify="between"
        px={4}
        py={2}
        class={css.panelHeader}
      >
        <Heading as="h2" size={2} weight="medium" color="lowContrast">
          Recordings
        </Heading>
      </Flex>

      <Box as="div" class={css.panelBody}>
        <For each={library}>
          {(rec) => (
            <Flex as="div" align="center" gap={3} class={css.entryLink}>
              <Flex
                as="div"
                align="center"
                justify="center"
                class={css.entryThumb}
              >
                <Text as="span" class={css.entryThumbIcon}>
                  &#9654;
                </Text>
              </Flex>
              <Flex as="div" direction="column" gap={1}>
                <Text as="span" size={2} weight="medium" class={css.truncate}>
                  {rec.name}
                </Text>
                <Text as="span" size={1} color="lowContrast">
                  {rec.duration}
                </Text>
              </Flex>
            </Flex>
          )}
        </For>
      </Box>

      <Flex as="div" justify="between" px={4} py={2} class={css.panelFooter}>
        <Text as="span" size={1} color="lowContrast">
          {library.length} recordings
        </Text>
        <Text as="span" size={1} color="lowContrast">
          1.2 GB used
        </Text>
      </Flex>
    </Box>
  );
}

// --- Track list during recording ---

function ActiveTracks() {
  return (
    <Flex as="div" direction="column" gap={3}>
      <Text
        as="span"
        size={1}
        weight="medium"
        color="lowContrast"
        align="center"
      >
        Active Tracks
      </Text>
      <Flex as="div" gap={2} wrap="wrap" justify="center">
        <For each={sessionTracks}>
          {(t) => (
            <Text
              as="span"
              size={1}
              class={`${css.trackPill} ${!t.live ? css.trackPillStopped : ''}`}
            >
              <Box
                as="div"
                class={t.live ? css.trackDotLive : css.trackDotStopped}
              />
              {t.label}
              <Show when={t.live}>
                <button class={css.trackStopButton}>&times;</button>
              </Show>
            </Text>
          )}
        </For>
      </Flex>
    </Flex>
  );
}

// --- States ---

function IdleState() {
  return (
    <Flex
      as="div"
      direction="column"
      align="center"
      gap={5}
      class={css.mainContent}
    >
      <Button size={3}>Start Recording</Button>
      <Text as="p" size={2} color="lowContrast">
        Record your screen, window, or tab
      </Text>
    </Flex>
  );
}

function RecordingState() {
  return (
    <Flex
      as="div"
      direction="column"
      align="center"
      gap={5}
      class={css.mainContent}
    >
      <Flex as="div" align="center" gap={2}>
        <Box as="div" class={css.recordingDot} />
        <Text as="span" size={2} weight="medium">
          Recording
        </Text>
      </Flex>
      <Text as="span" class={css.timer}>
        00:12:34
      </Text>
      <ActiveTracks />
      <Flex as="div" gap={3} wrap="wrap" justify="center">
        <Button variant="outline" color="neutral">
          Add Track
        </Button>
        <Button variant="outline" color="neutral">
          Pause All
        </Button>
        <Button variant="solid" color="danger">
          Stop All
        </Button>
      </Flex>
    </Flex>
  );
}

function PausedState() {
  return (
    <Flex
      as="div"
      direction="column"
      align="center"
      gap={5}
      class={css.mainContent}
    >
      <Flex as="div" align="center" gap={2}>
        <Box as="div" class={css.recordingDotPaused} />
        <Text as="span" size={2} weight="medium">
          Paused
        </Text>
      </Flex>
      <Text as="span" class={css.timer}>
        00:12:34
      </Text>
      <ActiveTracks />
      <Flex as="div" gap={3} wrap="wrap" justify="center">
        <Button variant="outline" color="neutral">
          Add Track
        </Button>
        <Button variant="solid">Resume All</Button>
        <Button variant="solid" color="danger">
          Stop All
        </Button>
      </Flex>
    </Flex>
  );
}

function ErrorState() {
  return (
    <Flex
      as="div"
      direction="column"
      align="center"
      gap={5}
      class={css.mainContent}
    >
      <Callout icon={<IconAlertCircleOutline />}>
        Permission denied — screen capture access was blocked. Click "Start
        Recording" to try again.
      </Callout>
      <Button size={3}>Start Recording</Button>
      <Text as="p" size={2} color="lowContrast">
        Record your screen, window, or tab
      </Text>
    </Flex>
  );
}

function UnsupportedState() {
  return (
    <Flex
      as="div"
      direction="column"
      align="center"
      justify="center"
      p={6}
      gap={4}
    >
      <Heading as="h1" size={5} weight="medium" align="center">
        Screen recording unavailable
      </Heading>
      <Text
        as="p"
        size={2}
        color="lowContrast"
        align="center"
        class={css.unsupportedText}
      >
        Your browser doesn't support screen capture. Try a desktop browser like
        Chrome, Edge, or Firefox.
      </Text>
    </Flex>
  );
}

// --- State switcher (prototype only) ---

function StateSwitcher(props: {
  state: State;
  onChange: (state: State) => void;
}) {
  const states: State[] = [
    'idle',
    'recording',
    'paused',
    'error',
    'unsupported',
  ];
  const labels: Record<State, string> = {
    idle: 'Idle',
    recording: 'Recording',
    paused: 'Paused',
    error: 'Error',
    unsupported: 'Mobile',
  };

  return (
    <Flex as="div" class={css.stateSwitcher}>
      <For each={states}>
        {(s) => (
          <button
            class={`${css.switcherButton} ${props.state === s ? css.switcherButtonActive : ''}`}
            onClick={() => props.onChange(s)}
          >
            {labels[s]}
          </button>
        )}
      </For>
    </Flex>
  );
}

// --- Root ---

export default function StudioC() {
  const [state, setState] = createSignal<State>('idle');

  return (
    <>
      <StateSwitcher state={state()} onChange={setState} />
      <Show when={state() === 'unsupported'}>
        <UnsupportedState />
      </Show>
      <Show when={state() !== 'unsupported'}>
        <Flex as="div" direction="column" class={css.shell}>
          <SiteHeader title="Recording Studio" />
          <Box as="div" class={css.body}>
            <Box as="main" class={css.main}>
              <Show when={state() === 'idle'}>
                <IdleState />
              </Show>
              <Show when={state() === 'recording'}>
                <RecordingState />
              </Show>
              <Show when={state() === 'paused'}>
                <PausedState />
              </Show>
              <Show when={state() === 'error'}>
                <ErrorState />
              </Show>
            </Box>
            <LibraryPanel />
          </Box>
        </Flex>
      </Show>
    </>
  );
}
