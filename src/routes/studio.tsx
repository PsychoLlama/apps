import { createSignal, Show } from 'solid-js';
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

// --- Logo SVG ---

// --- Warning icon for error state ---

function WarningIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 6v5M10 13.5v.5"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </svg>
  );
}

// --- Library panel ---

function LibraryPanel() {
  return (
    <aside class={css.panel}>
      <div class={css.panelHeader}>
        <h2 class={css.panelHeading}>Recordings</h2>
      </div>

      <div class={css.panelBody}>
        {library.map((rec) => (
          <div class={css.entryLink}>
            <div class={css.entryThumb}>
              <span class={css.entryThumbIcon}>&#9654;</span>
            </div>
            <div class={css.entryInfo}>
              <div class={css.entryName}>{rec.name}</div>
              <div class={css.entryMeta}>{rec.duration}</div>
            </div>
          </div>
        ))}
      </div>

      <div class={css.panelFooter}>
        <span>{library.length} recordings</span>
        <span>1.2 GB used</span>
      </div>
    </aside>
  );
}

// --- Track list during recording ---

function ActiveTracks() {
  return (
    <div class={css.trackSection}>
      <div class={css.trackSectionLabel}>Active Tracks</div>
      <div class={css.trackList}>
        {sessionTracks.map((t) => (
          <span
            class={`${css.trackPill} ${!t.live ? css.trackPillStopped : ''}`}
          >
            <span class={t.live ? css.trackDotLive : css.trackDotStopped} />
            {t.label}
            <Show when={t.live}>
              <button class={css.trackStopButton}>&times;</button>
            </Show>
          </span>
        ))}
      </div>
    </div>
  );
}

// --- States ---

function IdleState() {
  return (
    <div class={css.mainContent}>
      <button class={css.startButton}>Start Recording</button>
      <p class={css.subtitle}>Record your screen, window, or tab</p>
    </div>
  );
}

function RecordingState() {
  return (
    <div class={css.mainContent}>
      <div class={css.statusRow}>
        <span class={css.recordingDot} />
        <span class={css.statusLabel}>Recording</span>
      </div>
      <div class={css.timer}>00:12:34</div>
      <ActiveTracks />
      <div class={css.controlsRow}>
        <button class={css.ghostButton}>Add Track</button>
        <button class={css.ghostButton}>Pause All</button>
        <button class={css.dangerButton}>Stop All</button>
      </div>
    </div>
  );
}

function PausedState() {
  return (
    <div class={css.mainContent}>
      <div class={css.statusRow}>
        <span class={css.recordingDotPaused} />
        <span class={css.statusLabel}>Paused</span>
      </div>
      <div class={css.timer}>00:12:34</div>
      <ActiveTracks />
      <div class={css.controlsRow}>
        <button class={css.ghostButton}>Add Track</button>
        <button class={css.solidButton}>Resume All</button>
        <button class={css.dangerButton}>Stop All</button>
      </div>
    </div>
  );
}

function ErrorState() {
  const [dismissed, setDismissed] = createSignal(false);

  return (
    <div class={css.mainContent}>
      <Show when={!dismissed()}>
        <div class={css.errorBanner}>
          <div class={css.errorIcon}>
            <WarningIcon />
          </div>
          <div class={css.errorBody}>
            <div class={css.errorTitle}>Permission denied</div>
            <div class={css.errorText}>
              Screen capture access was blocked. Click "Start Recording" to try
              again.
            </div>
          </div>
          <button
            class={css.dismissButton}
            onClick={() => setDismissed(true)}
          >
            &times;
          </button>
        </div>
      </Show>
      <button class={css.startButton}>Start Recording</button>
      <p class={css.subtitle}>Record your screen, window, or tab</p>
    </div>
  );
}

function UnsupportedState() {
  return (
    <div class={css.unsupported}>
      <h1 class={css.unsupportedTitle}>Screen recording unavailable</h1>
      <p class={css.unsupportedText}>
        Your browser doesn't support screen capture. Try a desktop browser like
        Chrome, Edge, or Firefox.
      </p>
    </div>
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
    <div class={css.stateSwitcher}>
      {states.map((s) => (
        <button
          class={`${css.switcherButton} ${props.state === s ? css.switcherButtonActive : ''}`}
          onClick={() => props.onChange(s)}
        >
          {labels[s]}
        </button>
      ))}
    </div>
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
        <div class={css.shell}>
          <SiteHeader title="Recording Studio" />
          <div class={css.body}>
            <div class={css.main}>
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
            </div>
            <LibraryPanel />
          </div>
        </div>
      </Show>
    </>
  );
}
