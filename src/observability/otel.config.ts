import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis-4';
import { context, propagation, trace } from '@opentelemetry/api';
import { AsyncLocalStorage } from 'async_hooks';

const otelEndpoint = process.env.OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';

export const traceContextStorage = new AsyncLocalStorage<Map<string, any>>();

export function initOpenTelemetry(): NodeSDK {
  const sdk = new NodeSDK({
    spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({ url: otelEndpoint })),
    instrumentations: [
      new HttpInstrumentation(),
      new PgInstrumentation(),
      new RedisInstrumentation(),
    ],
    serviceName: 'wms-app',
  });

  sdk.start();
  process.on('SIGTERM', () => sdk.shutdown());
  return sdk;
}

export function getTracer() {
  return trace.getTracer('wms');
}

export function injectTraceContext(headers: Record<string, string>): Record<string, string> {
  const ctx = context.active();
  const carrier: Record<string, string> = {};
  propagation.inject(ctx, carrier);
  return { ...headers, ...carrier };
}

export function extractTraceContext(carrier: Record<string, string>): void {
  const ctx = propagation.extract(context.active(), carrier);
  context.with(ctx, () => {});
}
