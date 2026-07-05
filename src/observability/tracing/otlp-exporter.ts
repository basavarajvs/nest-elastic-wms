import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis-4';

export function createOtlpExporter() {
  const endpoint = process.env.OTLP_ENDPOINT;
  if (!endpoint) return null;
  return new OTLPTraceExporter({ url: endpoint });
}

export function createInstrumentations() {
  return [
    new HttpInstrumentation(),
    new PgInstrumentation(),
    new RedisInstrumentation(),
  ];
}
