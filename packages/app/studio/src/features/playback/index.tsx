import { Show, onMount } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { Button, Callout, Flex, Heading, LinkButton, Text } from '@lib/ui';
import { useEffect } from '@lib/state';
import IconDownload from 'virtual:icons/mdi/download-outline';
import IconTrashCan from 'virtual:icons/mdi/trash-can-outline';
import IconAlertCircle from 'virtual:icons/mdi/alert-circle-outline';
import { SiteHeader } from '@lib/shell';
import { library } from '../library/store';
import {
  deleteRecordingEffect,
  loadRecordingsEffect,
} from '../library/bindings';
import type { Recording } from '../library/types';
import { filenameSlug, formatDuration } from '../format';
import * as css from './playback.css';

const NotFound = () => {
  return (
    <Flex
      as="div"
      direction="column"
      align="center"
      justify="center"
      grow
      p={6}
    >
      <Flex as="div" direction="column" align="center" class={css.missing}>
        <Callout icon={<IconAlertCircle />}>
          <Text as="p" size={2}>
            Recording not found. It may have been deleted or not yet captured in
            this session.
          </Text>
        </Callout>
        <LinkButton testId="back-to-studio" href="/studio" variant="outline">
          Back to Studio
        </LinkButton>
      </Flex>
    </Flex>
  );
};

const Loading = () => {
  return (
    <Flex
      as="div"
      direction="column"
      align="center"
      justify="center"
      grow
      p={6}
    >
      <Text
        as="p"
        size={2}
        color="lowContrast"
        selectable={false}
        data-testid="playback-loading"
      >
        Loading recording…
      </Text>
    </Flex>
  );
};

const Player = (props: { recording: Recording; onDelete: () => void }) => {
  return (
    <Flex as="main" direction="column" align="center" grow class={css.main}>
      <Flex as="div" class={css.metaRow}>
        <Flex as="div" direction="column" gap={1}>
          <Heading as="h1" size={4} weight="medium" selectable>
            {props.recording.name}
          </Heading>
          <Text as="span" class={css.duration} selectable={false}>
            {formatDuration(props.recording.duration)}
          </Text>
        </Flex>
        <Flex as="div" align="center" wrap="wrap" gap={2}>
          {/*
            Raw anchor: solid-router's A rewrites `href` through
            resolvePath, which mangles non-//-scheme URLs like `blob:`
            into bogus relative paths. @lib/ui/Link wraps A, so it has
            the same bug for blob downloads.
          */}
          {/* eslint-disable-next-line custom/require-ui-primitives */}
          <a
            data-testid="download-recording"
            class={css.downloadLink}
            href={props.recording.url}
            download={`${filenameSlug(props.recording.createdAt)}.webm`}
          >
            <IconDownload />
            Download
          </a>
          <Button
            testId="delete-recording"
            variant="ghost"
            color="danger"
            onClick={props.onDelete}
          >
            <IconTrashCan />
            Delete
          </Button>
        </Flex>
      </Flex>

      <Flex as="div" class={css.stage}>
        <video
          class={css.video}
          src={props.recording.url}
          controls
          autoplay
          data-testid="playback-video"
        />
      </Flex>
    </Flex>
  );
};

export default function Playback() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const deleteRecording = useEffect(deleteRecordingEffect);
  const loadRecordings = useEffect(loadRecordingsEffect);

  const recording = () =>
    library.recordings.find((entry) => entry.id === params.id);

  // The effect's onFailure swallows OPFS errors and leaves the entry in
  // state, so checking `recording()` after awaiting tells us whether
  // the delete actually went through. On failure we stay put so the
  // user can retry instead of bouncing to a library that still shows
  // the recording.
  const handleDelete = async () => {
    const rec = recording();
    if (!rec) return;
    await deleteRecording({ id: rec.id, url: rec.url });
    if (!recording()) navigate('/studio');
  };

  onMount(() => {
    void loadRecordings();
  });

  return (
    <Flex as="div" direction="column" class={css.shell}>
      <SiteHeader
        trail={[
          { label: 'Studio', href: '/studio', testId: 'breadcrumb-studio' },
          { label: 'Playback' },
        ]}
      />
      <Flex as="div" direction="column" grow class={css.body}>
        <Show
          when={recording()}
          fallback={library.loaded ? <NotFound /> : <Loading />}
          keyed
        >
          {(rec) => (
            <Player recording={rec} onDelete={() => void handleDelete()} />
          )}
        </Show>
      </Flex>
    </Flex>
  );
}
