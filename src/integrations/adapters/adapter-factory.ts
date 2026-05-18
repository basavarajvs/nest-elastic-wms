import { Injectable, Logger } from '@nestjs/common';
import { IIntegrationAdapter } from './integration-adapter.interface';
import { ShopifyAdapter } from './shopify.adapter';
import { WooCommerceAdapter } from './woocommerce.adapter';
import { TokenBucketRateLimiter } from '../../common/rate-limiter/token-bucket.rate-limiter';
import { CoreIntegrationClientService } from '../core-integration-client.service';

interface AdapterCredentials {
  shopDomain?: string;
  accessToken?: string;
  webhookSecret?: string;
  baseUrl?: string;
  consumerKey?: string;
  consumerSecret?: string;
}

@Injectable()
export class AdapterFactory {
  private readonly logger = new Logger(AdapterFactory.name);

  constructor(
    private readonly rateLimiter: TokenBucketRateLimiter,
    private readonly coreIntegration: CoreIntegrationClientService,
  ) {}

  createAdapter(platform: string, credentials: AdapterCredentials, tenantId: string): IIntegrationAdapter {
    switch (platform) {
      case 'SHOPIFY':
        return new ShopifyAdapter(
          credentials.shopDomain!,
          credentials.accessToken!,
          credentials.webhookSecret || '',
          this.rateLimiter,
          this.coreIntegration,
          tenantId,
        );
      case 'WOOCOMMERCE':
        return new WooCommerceAdapter(
          credentials.baseUrl!,
          credentials.consumerKey!,
          credentials.consumerSecret!,
          credentials.webhookSecret || '',
          this.rateLimiter,
          this.coreIntegration,
          tenantId,
        );
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}
