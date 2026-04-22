import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  onCleanup,
  onMount,
} from 'solid-js';
import { Button, Callout, Flex, Heading, Link, Text } from '@lib/ui';
import { useAction, useEffect } from '@lib/state';
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
import { deleteRecordingEffect } from './library/bindings';
import { session } from './session/store';
import { library } from './library/store';
import { timer } from './timer/store';
import { tick } from './timer/bindings';
import type { Track } from './session/types';
import type { Recording } from './library/types';
import { formatDuration, formatElapsed } from './format';
import * as css from './studio.css';

const LibraryPanel = (props: {
  recordings: ReadonlyArray<Recording>;
  onDelete: (recording: Recording) => void;
}) => {
  return (
    <Flex as="aside" direction="column" class={css.panel}>
      <Flex as="div" align="center" justify="between" px={4} py={2}>
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
                      {formatDuration(rec.duration)}
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
};

const ActiveTracks = (props: {
  tracks: ReadonlyArray<Track>;
  onRemove: (trackId: string) => void;
}) => {
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
          {(track) => (
            <Flex as="div" align="center" gap={2} class={css.trackPill}>
              <Flex as="div" class={css.trackDot} />
              <Text as="span" size={1} selectable={false}>
                {track.label}
              </Text>
              <Button
                testId="remove-track"
                aria-label={`Remove ${track.label}`}
                size={1}
                variant="ghost"
                color="neutral"
                onClick={() => props.onRemove(track.id)}
              >
                <IconClose />
              </Button>
            </Flex>
          )}
        </For>
      </Flex>
    </Flex>
  );
};

const IdleState = (props: { onStart: () => void }) => {
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
};

const RecordingState = (props: {
  elapsed: number;
  tracks: ReadonlyArray<Track>;
  onPause: () => void;
  onStop: () => void;
  onAddTrack: () => void;
  onRemoveTrack: (trackId: string) => void;
}) => {
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
        {formatElapsed(props.elapsed)}
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
};

const PausedState = (props: {
  elapsed: number;
  tracks: ReadonlyArray<Track>;
  onResume: () => void;
  onStop: () => void;
  onAddTrack: () => void;
  onRemoveTrack: (trackId: string) => void;
}) => {
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
        {formatElapsed(props.elapsed)}
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
};

const StoppingState = (props: { elapsed: number }) => {
  return (
    <Flex
      as="div"
      direction="column"
      align="center"
      gap={5}
      class={css.mainContent}
    >
      <Text as="span" size={2} weight="medium" color="lowContrast">
        Stopping…
      </Text>
      <Text as="span" class={css.timer} selectable={false}>
        {formatElapsed(props.elapsed)}
      </Text>
    </Flex>
  );
};

const ErrorState = (props: { error: string; onRetry: () => void }) => {
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
          {props.error}
        </Text>
      </Callout>
      <Button testId="start-recording" size={3} onClick={props.onRetry}>
        Try Again
      </Button>
      <Text as="p" size={2} color="lowContrast">
        Record your screen, window, or tab
      </Text>
    </Flex>
  );
};

const UnsupportedState = () => {
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
};

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

  const handleStart = () => {
    void startRecording(() => void stopRecording());
  };

  onMount(() => {
    checkSupport();
  });

  // Tick only while a recording is actively advancing. Pausing or
  // stopping cleans up the interval; resuming spins a new one.
  createEffect(() => {
    if (session.status !== 'recording') return;
    const tickInterval = setInterval(() => publishTick(Date.now()), 1000);
    onCleanup(() => clearInterval(tickInterval));
  });

  return (
    <Show
      when={session.status !== 'unsupported'}
      fallback={<UnsupportedState />}
    >
      <Flex as="div" direction="column" class={css.shell}>
        <SiteHeader title="Recording Studio" />
        <Flex as="div" grow class={css.body}>
          <Flex as="main" align="center" justify="center" grow class={css.main}>
            <Switch>
              <Match when={session.status === 'idle'}>
                <IdleState onStart={handleStart} />
              </Match>
              <Match when={session.status === 'recording'}>
                <RecordingState
                  elapsed={timer.elapsed}
                  tracks={session.tracks}
                  onPause={() => pauseRecording()}
                  onStop={() => void stopRecording()}
                  onAddTrack={() => void addTrack()}
                  onRemoveTrack={removeTrack}
                />
              </Match>
              <Match when={session.status === 'paused'}>
                <PausedState
                  elapsed={timer.elapsed}
                  tracks={session.tracks}
                  onResume={() => resumeRecording()}
                  onStop={() => void stopRecording()}
                  onAddTrack={() => void addTrack()}
                  onRemoveTrack={removeTrack}
                />
              </Match>
              <Match when={session.status === 'stopping'}>
                <StoppingState elapsed={timer.elapsed} />
              </Match>
              <Match when={session.status === 'error' && session.error} keyed>
                {(error) => <ErrorState error={error} onRetry={handleStart} />}
              </Match>
            </Switch>
          </Flex>
          <LibraryPanel
            recordings={library.recordings.slice().reverse()}
            onDelete={(rec) => deleteRecording({ id: rec.id, url: rec.url })}
          />
        </Flex>
      </Flex>
    </Show>
  );
}
