import { Injectable, Logger } from '@nestjs/common';

export interface ScaleReading {
  weightKg: number;
  isStable: boolean;
  unit: string;
  timestamp: Date;
}

export interface ScaleProvider {
  getWeight(): Promise<ScaleReading>;
}

@Injectable()
export class ScaleIntegrationService {
  private readonly logger = new Logger(ScaleIntegrationService.name);
  private provider: ScaleProvider;

  constructor() {
    this.provider = new DummyScaleProvider();
  }

  setProvider(provider: ScaleProvider) {
    this.provider = provider;
  }

  async captureWeight(): Promise<ScaleReading> {
    return this.provider.getWeight();
  }
}

class DummyScaleProvider implements ScaleProvider {
  async getWeight(): Promise<ScaleReading> {
    return { weightKg: 5.0, isStable: true, unit: 'kg', timestamp: new Date() };
  }
}
