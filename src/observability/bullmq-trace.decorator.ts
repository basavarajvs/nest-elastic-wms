import { context, propagation, trace } from '@opentelemetry/api';
import { Job } from 'bullmq';
import { traceContextStorage } from './otel.config';

export function serializeTraceContext(): Record<string, string> {
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);
  const store = traceContextStorage.getStore();
  if (store) {
    carrier['x-request-id'] = store.get('traceId') || '';
    carrier['x-tenant-id'] = store.get('tenantId') || '';
  }
  return carrier;
}

export function attachTraceToJobData(data: Record<string, any>): Record<string, any> {
  return {
    ...data,
    traceContext: serializeTraceContext(),
  };
}

export function restoreTraceContext(job: Job): void {
  const traceContext = job.data?.traceContext as Record<string, any> | undefined;
  if (traceContext) {
    const ctx = propagation.extract(context.active(), traceContext);
    const storeMap = new Map<string, any>();
    storeMap.set('traceId', traceContext['x-request-id'] || traceContext.traceparent || '');
    storeMap.set('tenantId', traceContext['x-tenant-id'] || '');

    traceContextStorage.run(storeMap, () => {
      context.with(ctx, () => {});
    });

    if (traceContext.traceparent) {
      const span = trace.getTracer('wms').startSpan(`bullmq.process.${job.queueName}`, {
        attributes: {
          'messaging.system': 'bullmq',
          'messaging.destination': job.queueName,
          'messaging.message_id': job.id || '',
          'messaging.job.name': job.name,
        },
      });
      context.with(trace.setSpan(context.active(), span), () => {});
      job.data._span = span;
    }
  }
}

export function finalizeJobSpan(job: Job, error?: Error): void {
  const span = job.data?._span;
  if (span) {
    if (error) {
      span.recordException(error);
      span.setStatus({ code: 2, message: error.message });
    }
    span.end();
    delete job.data._span;
  }
}
