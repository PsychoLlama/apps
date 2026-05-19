import { For, Match, Switch, type Component } from 'solid-js';
import {
  Badge,
  DataListItem,
  DataListLabel,
  DataListRoot,
  DataListValue,
} from '@lib/ui';
import type { ParsedPayload } from './parsers';

interface ParsedPayloadProps {
  payload: ParsedPayload;
}

const KIND_LABEL: Record<ParsedPayload['kind'], string> = {
  url: 'URL',
  email: 'Email',
  sms: 'Text message',
  tel: 'Phone',
  wifi: 'Wi-Fi',
  geo: 'Location',
  vcard: 'Contact card',
  text: 'Plain text',
};

/** Render a parsed barcode payload as a kind-tagged DataList. */
export const ParsedPayloadView: Component<ParsedPayloadProps> = (props) => (
  <DataListRoot orientation="vertical" size={2}>
    <DataListItem>
      <DataListLabel>Kind</DataListLabel>
      <DataListValue>
        <Badge color="accent" variant="soft" size={1}>
          {KIND_LABEL[props.payload.kind]}
        </Badge>
      </DataListValue>
    </DataListItem>

    <Switch>
      <Match
        when={props.payload.kind === 'url' ? props.payload : undefined}
        keyed
      >
        {(payload) => (
          <>
            <DataListItem>
              <DataListLabel>Protocol</DataListLabel>
              <DataListValue>{payload.protocol}</DataListValue>
            </DataListItem>
            <DataListItem>
              <DataListLabel>Href</DataListLabel>
              <DataListValue>{payload.href}</DataListValue>
            </DataListItem>
          </>
        )}
      </Match>

      <Match
        when={props.payload.kind === 'email' ? props.payload : undefined}
        keyed
      >
        {(payload) => (
          <>
            <DataListItem>
              <DataListLabel>To</DataListLabel>
              <DataListValue>{payload.to}</DataListValue>
            </DataListItem>
            <DataListItem>
              <DataListLabel>Subject</DataListLabel>
              <DataListValue>{payload.subject ?? '—'}</DataListValue>
            </DataListItem>
            <DataListItem>
              <DataListLabel>Body</DataListLabel>
              <DataListValue>{payload.body ?? '—'}</DataListValue>
            </DataListItem>
          </>
        )}
      </Match>

      <Match
        when={props.payload.kind === 'sms' ? props.payload : undefined}
        keyed
      >
        {(payload) => (
          <>
            <DataListItem>
              <DataListLabel>Phone</DataListLabel>
              <DataListValue>{payload.phone}</DataListValue>
            </DataListItem>
            <DataListItem>
              <DataListLabel>Body</DataListLabel>
              <DataListValue>{payload.body ?? '—'}</DataListValue>
            </DataListItem>
          </>
        )}
      </Match>

      <Match
        when={props.payload.kind === 'tel' ? props.payload : undefined}
        keyed
      >
        {(payload) => (
          <DataListItem>
            <DataListLabel>Phone</DataListLabel>
            <DataListValue>{payload.phone}</DataListValue>
          </DataListItem>
        )}
      </Match>

      <Match
        when={props.payload.kind === 'wifi' ? props.payload : undefined}
        keyed
      >
        {(payload) => (
          <>
            <DataListItem>
              <DataListLabel>SSID</DataListLabel>
              <DataListValue>{payload.ssid ?? '—'}</DataListValue>
            </DataListItem>
            <DataListItem>
              <DataListLabel>Security</DataListLabel>
              <DataListValue>{payload.security ?? '—'}</DataListValue>
            </DataListItem>
            <DataListItem>
              <DataListLabel>Password</DataListLabel>
              <DataListValue>{payload.password ?? '—'}</DataListValue>
            </DataListItem>
            <DataListItem>
              <DataListLabel>Hidden</DataListLabel>
              <DataListValue>
                {payload.hidden === undefined
                  ? '—'
                  : payload.hidden
                    ? 'yes'
                    : 'no'}
              </DataListValue>
            </DataListItem>
          </>
        )}
      </Match>

      <Match
        when={props.payload.kind === 'geo' ? props.payload : undefined}
        keyed
      >
        {(payload) => (
          <>
            <DataListItem>
              <DataListLabel>Latitude</DataListLabel>
              <DataListValue>{payload.latitude}</DataListValue>
            </DataListItem>
            <DataListItem>
              <DataListLabel>Longitude</DataListLabel>
              <DataListValue>{payload.longitude}</DataListValue>
            </DataListItem>
          </>
        )}
      </Match>

      <Match
        when={props.payload.kind === 'vcard' ? props.payload : undefined}
        keyed
      >
        {(payload) => (
          <For each={payload.fields}>
            {(field) => (
              <DataListItem>
                <DataListLabel>{field.key}</DataListLabel>
                <DataListValue>{field.value}</DataListValue>
              </DataListItem>
            )}
          </For>
        )}
      </Match>

      <Match
        when={props.payload.kind === 'text' ? props.payload : undefined}
        keyed
      >
        {(payload) => (
          <DataListItem>
            <DataListLabel>Text</DataListLabel>
            <DataListValue>{payload.text}</DataListValue>
          </DataListItem>
        )}
      </Match>
    </Switch>
  </DataListRoot>
);
