import { For, Show, onCleanup, onMount } from 'solid-js';
import { Button, Callout, Flex, Heading, Link, Text } from '#ui';
import { useAction, useEffect } from '#state';
import IconAlertCircleOutline from 'virtual:icons/mdi/alert-circle-outline';
import IconClose from 'virtual:icons/mdi/close';
import IconPlayOutline from 'virtual:icons/mdi/play-outline';
import IconTrashCanOutline from 'virtual:icons/mdi/trash-can-outline';
import SiteHeader from '../../components/site-header';
import {
  addTrackEffect,
  checkSupportEffect,
  pauseRecordingEffect,
  removeTrackEffect,
  resumeRecordingEffect,
  startRecordingEffect,
  stopRecordingEffect,
} from './session/bindings';
import { deleteRecordingEffect } from './library/effects';
import { session } from './session/store';
import { library } from './library/store';
import { timer } from './timer/store';
import { tick } from './timer/actions';
import type { Recording } from './library/types';
import * as css from './studio.css';

// --- Timer display ---

function secondsToDuration(totalSeconds: number) {
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const elapsedFormat = new Intl.DurationFormat('en', {
  style: 'digital',
  hours: '2-digit',
});

const durationFormat = new Intl.DurationFormat('en', {
  style: 'digital',
});

// --- Library panel ---

function LibraryPanel(props: {
  recordings: Recording[];
  onDelete: (recording: Recording) => void;
}) {
  return (
    <Flex as="aside" direction="column" class={css.panel}>
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

      <Flex as="div" direction="column" class={css.panelBody}>
        <Show
          when={props.recordings.length > 0}
          fallback={
            <Text
              as="p"
              size={2}
              color="lowContrast"
              align="center"
              class={css.emptyLibrary}
            >
              No recordings yet
            </Text>
          }
        >
          <For each={props.recordings}>
            {(rec) => (
              <Flex
                as="div"
                align="center"
                gap={3}
                px={4}
                py={2}
                class={css.entryRow}
              >
                <Link
                  testId="recording-entry"
                  class={css.entryLink}
                  href={`/studio/${rec.id}`}
                  underline="none"
                >
                  <Flex
                    as="div"
                    align="center"
                    justify="center"
                    class={css.entryThumb}
                  >
                    <IconPlayOutline class={css.entryThumbIcon} />
                  </Flex>
                  <Flex as="div" direction="column" gap={1} grow>
                    <Text
                      as="span"
                      size={2}
                      weight="medium"
                      class={css.truncate}
                      selectable={false}
                    >
                      {rec.name}
                    </Text>
                    <Text
                      as="span"
                      size={1}
                      color="lowContrast"
                      selectable={false}
                    >
                      {durationFormat.format(secondsToDuration(rec.duration))}
                    </Text>
                  </Flex>
                </Link>
                <Button
                  testId="delete-recording"
                  aria-label={`Delete ${rec.name}`}
                  size={1}
                  variant="ghost"
                  color="danger"
                  onClick={() => props.onDelete(rec)}
                >
                  <IconTrashCanOutline />
                </Button>
              </Flex>
            )}
          </For>
        </Show>
      </Flex>

      <Flex as="div" justify="between" px={4} py={2} class={css.panelFooter}>
        <Text as="span" size={1} color="lowContrast" selectable={false}>
          {props.recordings.length} recordings
        </Text>
      </Flex>
    </Flex>
  );
}

// --- Track list during recording ---

function ActiveTracks(props: {
  tracks: { id: string; type: string; label: string; live: boolean }[];
  onRemove: (trackId: string) => void;
}) {
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
        <For each={props.tracks}>
          {(t) => (
            <Text
              as="span"
              size={1}
              selectable={false}
              class={`${css.trackPill} ${!t.live ? css.trackPillStopped : ''}`}
            >
              <Flex
                as="div"
                class={t.live ? css.trackDotLive : css.trackDotStopped}
              />
              {t.label}
              <Show when={t.live}>
                <Button
                  testId="remove-track"
                  aria-label={`Remove ${t.label}`}
                  size={1}
                  variant="ghost"
                  color="neutral"
                  onClick={() => props.onRemove(t.id)}
                >
                  <IconClose />
                </Button>
              </Show>
            </Text>
          )}
        </For>
      </Flex>
    </Flex>
  );
}

// --- States ---

function IdleState(props: { onStart: () => void }) {
  return (
    <Flex
      as="div"
      direction="column"
      align="center"
      gap={5}
      class={css.mainContent}
    >
      <Button testId="start-recording" size={3} onClick={props.onStart}>
        Start Recording
      </Button>
      <Text as="p" size={2} color="lowContrast">
        Record your screen, window, or tab
      </Text>
    </Flex>
  );
}

function RecordingState(props: {
  elapsed: number;
  tracks: { id: string; type: string; label: string; live: boolean }[];
  onPause: () => void;
  onStop: () => void;
  onAddTrack: () => void;
  onRemoveTrack: (trackId: string) => void;
}) {
  return (
    <Flex
      as="div"
      direction="column"
      align="center"
      gap={5}
      class={css.mainContent}
    >
      <Flex as="div" align="center" gap={2}>
        <Flex as="div" class={css.recordingDot} />
        <Text as="span" size={2} weight="medium">
          Recording
        </Text>
      </Flex>
      <Text as="span" class={css.timer} selectable={false}>
        {elapsedFormat.format(secondsToDuration(props.elapsed))}
      </Text>
      <ActiveTracks tracks={props.tracks} onRemove={props.onRemoveTrack} />
      <Flex as="div" gap={3} wrap="wrap" justify="center">
        <Button
          testId="add-track"
          variant="outline"
          color="neutral"
          onClick={props.onAddTrack}
        >
          Add Track
        </Button>
        <Button
          testId="pause-all"
          variant="outline"
          color="neutral"
          onClick={props.onPause}
        >
          Pause All
        </Button>
        <Button
          testId="stop-all"
          variant="solid"
          color="danger"
          onClick={props.onStop}
        >
          Stop All
        </Button>
      </Flex>
    </Flex>
  );
}

function PausedState(props: {
  elapsed: number;
  tracks: { id: string; type: string; label: string; live: boolean }[];
  onResume: () => void;
  onStop: () => void;
  onAddTrack: () => void;
  onRemoveTrack: (trackId: string) => void;
}) {
  return (
    <Flex
      as="div"
      direction="column"
      align="center"
      gap={5}
      class={css.mainContent}
    >
      <Flex as="div" align="center" gap={2}>
        <Flex as="div" class={css.recordingDotPaused} />
        <Text as="span" size={2} weight="medium">
          Paused
        </Text>
      </Flex>
      <Text as="span" class={css.timer} selectable={false}>
        {elapsedFormat.format(secondsToDuration(props.elapsed))}
      </Text>
      <ActiveTracks tracks={props.tracks} onRemove={props.onRemoveTrack} />
      <Flex as="div" gap={3} wrap="wrap" justify="center">
        <Button
          testId="add-track"
          variant="outline"
          color="neutral"
          onClick={props.onAddTrack}
        >
          Add Track
        </Button>
        <Button testId="resume-all" variant="solid" onClick={props.onResume}>
          Resume All
        </Button>
        <Button
          testId="stop-all"
          variant="solid"
          color="danger"
          onClick={props.onStop}
        >
          Stop All
        </Button>
      </Flex>
    </Flex>
  );
}

function ErrorState(props: { error: string | null; onRetry: () => void }) {
  return (
    <Flex
      as="div"
      direction="column"
      align="center"
      gap={5}
      class={css.mainContent}
    >
      <Callout icon={<IconAlertCircleOutline />}>
        <Text as="p" size={2} selectable={false}>
          {props.error ??
            'Permission denied — screen capture access was blocked.'}
        </Text>
      </Callout>
      <Button testId="start-recording" size={3} onClick={props.onRetry}>
        Start Recording
      </Button>
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

// --- Root ---

export default function Studio() {
  const startRecording = useEffect(startRecordingEffect);
  const stopRecording = useEffect(stopRecordingEffect);
  const pauseRecording = useEffect(pauseRecordingEffect);
  const resumeRecording = useEffect(resumeRecordingEffect);
  const addTrack = useEffect(addTrackEffect);
  const removeTrack = useEffect(removeTrackEffect);
  const checkSupport = useEffect(checkSupportEffect);
  const deleteRecording = useEffect(deleteRecordingEffect);
  const publishTick = useAction(tick);

  function handleStart() {
    void startRecording(() => {
      void stopRecording(timer.elapsed);
    });
  }

  function handleStop() {
    void stopRecording(timer.elapsed);
  }

  function handleAddTrack() {
    void addTrack('microphone');
  }

  function handleDelete(recording: Recording) {
    deleteRecording({ id: recording.id, url: recording.url });
  }

  onMount(() => {
    checkSupport(undefined);
  });
  const tickInterval = setInterval(() => publishTick(undefined), 1000);

  onCleanup(() => {
    clearInterval(tickInterval);
  });

  return (
    <>
      <Show when={session.status === 'unsupported'}>
        <UnsupportedState />
      </Show>
      <Show when={session.status !== 'unsupported'}>
        <Flex as="div" direction="column" class={css.shell}>
          <SiteHeader title="Recording Studio" />
          <Flex as="div" grow class={css.body}>
            <Flex
              as="main"
              align="center"
              justify="center"
              grow
              class={css.main}
            >
              <Show when={session.status === 'idle'}>
                <IdleState onStart={handleStart} />
              </Show>
              <Show when={session.status === 'recording'}>
                <RecordingState
                  elapsed={timer.elapsed}
                  tracks={[...session.tracks]}
                  onPause={() => pauseRecording(undefined)}
                  onStop={handleStop}
                  onAddTrack={handleAddTrack}
                  onRemoveTrack={removeTrack}
                />
              </Show>
              <Show when={session.status === 'paused'}>
                <PausedState
                  elapsed={timer.elapsed}
                  tracks={[...session.tracks]}
                  onResume={() => resumeRecording(undefined)}
                  onStop={handleStop}
                  onAddTrack={handleAddTrack}
                  onRemoveTrack={removeTrack}
                />
              </Show>
              <Show when={session.status === 'error'}>
                <ErrorState error={session.error} onRetry={handleStart} />
              </Show>
            </Flex>
            <LibraryPanel
              recordings={[...library.recordings].reverse()}
              onDelete={handleDelete}
            />
          </Flex>
        </Flex>
      </Show>
    </>
  );
}
