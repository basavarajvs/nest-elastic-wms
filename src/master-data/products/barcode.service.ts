import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/cache/redis.constants';

const BARCODE_CACHE_TTL = 3600; // 1 hour

@Injectable()
export class BarcodeService {
  private readonly logger = new Logger(BarcodeService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  validateFormat(code: string, type: string): boolean {
    switch (type) {
      case 'EAN13':
        return /^\d{13}$/.test(code) && this.checksumEan13(code);
      case 'UPC_A':
        return /^\d{12}$/.test(code);
      case 'CODE128':
      case 'INTERNAL':
        return /^[A-Za-z0-9\-_]+$/.test(code) && code.length <= 50;
      case 'GS1_128':
        return /^\(?\d{2,4}\)?\d+/.test(code);
      case 'QR_CODE':
        return code.length > 0 && code.length <= 200;
      default:
        return false;
    }
  }

  private checksumEan13(code: string): boolean {
    if (code.length !== 13) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const check = (10 - (sum % 10)) % 10;
    return check === parseInt(code[12]);
  }

  async lookupBarcode(barcodeValue: string, tenantId: string): Promise<any> {
    // Challenge 1: Redis cache for sub-5ms RF scan
    const cacheKey = `barcode:${barcodeValue}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.tenantId === tenantId) return parsed.data;
      // If tenant mismatch, ignore cache
    }

    // Indexed query: uses idx_pb_barcode_tenant (barcode_value, tenant_id)
    const barcode = await (this.prisma as any).productBarcode.findFirst({
      where: { barcodeValue, tenantId, isActive: true },
      include: {
        product: {
          include: {
            baseUom: { select: { id: true, code: true, name: true } },
            category: { select: { id: true, categoryCode: true, name: true } },
          },
        },
      },
    });

    if (!barcode) throw new NotFoundException('Barcode not found');

    const product = barcode.product;
    const result = {
      productCode: product.productCode,
      name: product.name,
      baseUomCode: product.baseUom?.code || 'EA',
      baseUomName: product.baseUom?.name || 'Each',
      trackLot: product.trackLot,
      trackSerial: product.trackSerial,
      velocityClass: product.velocityClass,
      categoryCode: product.category?.categoryCode,
      barcodes: [barcode.barcodeValue],
      // Challenge 5: conversion info for pallet/case scans
      scannedAs: barcode.childUomCode || null,
      scannedQuantity: barcode.quantityPerScan || 1,
      conversionFactor: barcode.childUomCode ? (barcode.quantityPerScan || 1) : 1,
    };

    // Cache for 1 hour with tenant scoping
    await this.redis.setex(
      cacheKey,
      BARCODE_CACHE_TTL,
      JSON.stringify({ tenantId, data: result }),
    );

    return result;
  }

  async assignPrimary(barcodeId: string, tenantId: string): Promise<void> {
    const barcode = await (this.prisma as any).productBarcode.findFirst({
      where: { id: barcodeId, tenantId },
    });
    if (!barcode) throw new NotFoundException('Barcode not found');

    await (this.prisma as any).productBarcode.updateMany({
      where: { productId: barcode.productId, tenantId },
      data: { isPrimary: false },
    });
    await (this.prisma as any).productBarcode.update({
      where: { id: barcodeId },
      data: { isPrimary: true },
    });
  }

  async invalidateCache(barcodeValue: string): Promise<void> {
    await this.redis.del(`barcode:${barcodeValue}`);
  }
}
