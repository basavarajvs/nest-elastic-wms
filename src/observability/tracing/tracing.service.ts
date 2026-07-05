import { Injectable, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { createOtlpExporter, createInstrumentations } from './otlp-exporter';

@Injectable()
export class TracingService implements OnModuleInit, OnApplicationShutdown {
  private sdk: NodeSDK | null = null;

  onModuleInit() {
    const traceExporter = createOtlpExporter();
    if (!traceExporter) return;

    try {
      this.sdk = new NodeSDK({
        traceExporter,
        instrumentations: createInstrumentations(),
      });
      this.sdk.start();
    } catch (error) {
      console.warn('Failed to initialize OpenTelemetry SDK', error);
    }
  }

  async onApplicationShutdown() {
    if (this.sdk) {
      try {
        await this.sdk.shutdown();
      } catch (error) {
        console.warn('Error shutting down OpenTelemetry SDK', error);
      }
    }
  }
}
