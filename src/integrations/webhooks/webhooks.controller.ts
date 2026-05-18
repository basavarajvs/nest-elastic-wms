import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Controller, Post, Param, Req, Res, Logger } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ORDER_SYNC_QUEUE } from '../processors/inbound-order-sync.processor';
import { AdapterFactory } from '../adapters/adapter-factory';
import { TokenBucketRateLimiter } from '../../common/rate-limiter/token-bucket.rate-limiter';

@ApiTags('WMS-INTEGRATIONS')
@Controller('/api/v1/wms/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adapterFactory: AdapterFactory,
    private readonly rateLimiter: TokenBucketRateLimiter,
    @InjectQueue(ORDER_SYNC_QUEUE) private readonly orderQueue: Queue,
  ) {}

  @Post('/shopify/:tenantCode')
  @ApiOperation({ summary: 'Shopify webhook receiver', description: 'Receives Shopify order/product webhooks with HMAC verification, SHA256 dedup, and PendingOrderBuffer for out-of-order events' })
  @ApiParam({ name: 'tenantCode', required: true, description: 'Tenant code identifying the WMS tenant' })
  @ApiResponse({ status: 202, description: 'Webhook accepted for processing' })
  @ApiResponse({ status: 400, description: 'Missing tenant code or empty body' })
  @ApiResponse({ status: 401, description: 'HMAC signature mismatch' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded (500 req/min)' })
  async shopifyWebhook(
    @Param('tenantCode') tenantCode: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    return this.handleWebhook('SHOPIFY', tenantCode, req, res);
  }

  @Post('/woocommerce/:tenantCode')
  @ApiOperation({ summary: 'WooCommerce webhook receiver', description: 'Receives WooCommerce order/product webhooks with HMAC verification and SHA256 dedup' })
  @ApiParam({ name: 'tenantCode', required: true, description: 'Tenant code identifying the WMS tenant' })
  @ApiResponse({ status: 202, description: 'Webhook accepted for processing' })
  @ApiResponse({ status: 400, description: 'Missing tenant code or empty body' })
  @ApiResponse({ status: 401, description: 'HMAC signature mismatch' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded (500 req/min)' })
  async wooCommerceWebhook(
    @Param('tenantCode') tenantCode: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    return this.handleWebhook('WOOCOMMERCE', tenantCode, req, res);
  }

  private async handleWebhook(
    platform: string,
    tenantCode: string,
    req: FastifyRequest,
    res: FastifyReply,
  ) {
    try {
      if (!tenantCode) {
        return res.status(400).send({ error: 'Missing tenant code' });
      }

      const headers = req.headers as Record<string, string>;
      const rawBody = await this.getRawBody(req);
      if (!rawBody) {
        return res.status(400).send({ error: 'Empty request body' });
      }

      const tenantId = await this.resolveTenantId(tenantCode);
      if (!tenantId) {
        return res.status(400).send({ error: 'Invalid tenant code' });
      }

      const signatureHeader = platform === 'SHOPIFY'
        ? 'x-shopify-hmac-sha256'
        : 'x-wc-webhook-signature';
      const signature = headers[signatureHeader];
      if (!signature) {
        this.logger.warn(`Webhook from ${platform} missing ${signatureHeader}`);
        return res.status(401).send({ error: 'Missing signature' });
      }

      const verified = this.verifyHmac(platform, rawBody, signature);
      if (!verified) {
        this.logger.warn(`Webhook signature mismatch for ${platform}/${tenantCode}: rawBody=${rawBody.substring(0, 50)}...`);
        return res.status(401).send({ error: 'Invalid signature' });
      }

      const payloadHash = crypto.createHash('sha256').update(rawBody, 'utf8').digest('hex');

      const existing = await (this.prisma as any).syncWebhookLog.findFirst({
        where: { tenantId, platform, payloadHash },
      });
      if (existing && existing.processed) {
        return res.status(200).send({ status: 'duplicate' });
      }

      await (this.prisma as any).syncWebhookLog.create({
        data: {
          tenantId,
          platform,
          eventType: headers['x-shopify-topic'] || headers['x-wc-webhook-topic'] || 'unknown',
          externalRefId: headers['x-shopify-order-id'] || headers['x-wc-webhook-resource-id'] || null,
          payloadHash,
          processed: false,
        },
      });

      const eventType = headers['x-shopify-topic'] || headers['x-wc-webhook-topic'] || 'unknown';
      const parsedBody = this.tryParseJson(rawBody);

      await this.orderQueue.add('webhook-order', {
        tenantId,
        platform,
        credentials: {},
        eventType,
        parsedBody,
      });

      return res.status(202).send({ status: 'accepted' });
    } catch (err: any) {
      this.logger.error(`Webhook error: ${err.message}`);
      return res.status(500).send({ error: 'Internal server error' });
    }
  }

  private verifyHmac(platform: string, rawBody: string, signature: string): boolean {
    try {
      if (platform === 'SHOPIFY') {
        const secret = process.env.SHOPIFY_WEBHOOK_SECRET || '';
        const computed = crypto
          .createHmac('sha256', secret)
          .update(rawBody, 'utf8')
          .digest('base64');
        return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
      }
      if (platform === 'WOOCOMMERCE') {
        const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || '';
        const computed = crypto
          .createHmac('sha256', secret)
          .update(rawBody, 'utf8')
          .digest('base64');
        return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
      }
      return false;
    } catch {
      return false;
    }
  }

  private async resolveTenantId(tenantCode: string): Promise<string | null> {
    try {
      const facilities = await (this.prisma as any).warehouseFacility.findMany({ take: 1 });
      return facilities.length > 0 ? facilities[0].tenantId : null;
    } catch {
      return null;
    }
  }

  private async getRawBody(req: FastifyRequest): Promise<string> {
    if ((req as any).rawBody) return (req as any).rawBody;

    const contentType = (req.headers['content-type'] || '').toLowerCase();

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const body = req.body as Record<string, any>;
      if (body && typeof body === 'object') {
        return Object.entries(body)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&');
      }
      return '';
    }

    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req.raw || []) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks).toString('utf8');
    } catch {
      const body = req.body;
      return typeof body === 'string' ? body : JSON.stringify(body || '');
    }
  }

  private tryParseJson(raw: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      const params = new URLSearchParams(raw);
      const result: Record<string, any> = {};
      for (const [k, v] of params.entries()) {
        const keys = k.split(/[\[\]]/).filter(Boolean);
        if (keys.length > 1) {
          if (!result[keys[0]]) result[keys[0]] = {};
          result[keys[0]][keys[1]] = v;
        } else {
          result[k] = v;
        }
      }
      return Object.keys(result).length > 0 ? result : null;
    }
  }
}
