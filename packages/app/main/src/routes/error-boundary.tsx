import ErrorBoundaryFallback from '../error-boundary';

const sampleError = new TypeError(
  "Cannot read properties of undefined (reading 'duration')",
);

sampleError.stack = `TypeError: Cannot read properties of undefined (reading 'duration')
    at finalizeTrack (studio/recorder.ts:142:18)
    at Recorder.stop (studio/recorder.ts:208:7)
    at HTMLButtonElement.<anonymous> (studio/controls.tsx:67:24)
    at runWithOwner (solid-js/index.ts:1320:5)
    at HTMLButtonElement.eventHandler (solid-js/web.ts:412:9)`;

/** Static preview of the global error boundary fallback. */
export default function ErrorBoundaryPreview() {
  return <ErrorBoundaryFallback error={sampleError} />;
}
