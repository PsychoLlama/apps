export { createLogger, type AppLogger } from './logging';
export { createTracer, type AppTracer } from './trace';
export { configure, type ConfigureOptions } from './setup';

export { trace, context, SpanKind, SpanStatusCode } from '@opentelemetry/api';
export type {
  AttributeValue,
  Attributes,
  Context,
  Exception,
  Link,
  Span,
  SpanContext,
  SpanOptions,
  SpanStatus,
  TimeInput,
  Tracer,
  TracerProvider,
} from '@opentelemetry/api';
export { logs, SeverityNumber } from '@opentelemetry/api-logs';
export type {
  AnyValue,
  AnyValueMap,
  LogAttributes,
  LogBody,
  Logger,
  LoggerOptions,
  LoggerProvider,
  LogRecord,
} from '@opentelemetry/api-logs';
